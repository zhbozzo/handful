import CoreImage
import CoreML
import ExpoModulesCore
import ImageIO
import UIKit
import Vision

/// Privacy Shield: on-device detection and redaction of identifying details in photos.
///
/// Everything runs locally with Apple's Vision and Core Image frameworks.
/// The original photo never leaves the device; only the redacted re-encode
/// (no GPS, camera or capture metadata) is handed back to JavaScript.
public class PrivacyShieldModule: Module {
  private let ciContext = CIContext(options: [.cacheIntermediates: false])

  public func definition() -> ModuleDefinition {
    Name("PrivacyShield")

    Constant("isAvailable") { true }

    /// Detects faces, text and document-like regions, and reads location metadata.
    /// All boxes are normalized (0…1) with a top-left origin.
    AsyncFunction("analyze") { (uri: String) throws -> [String: Any] in
      let started = Date()
      let url = try Self.fileURL(uri)
      let metadata = Self.readMetadata(url)
      let image = try Self.loadNormalized(url, maxDimension: 2048)
      guard let cgImage = image.cgImage else { throw ShieldError("Could not decode the image.") }

      let faceRequest = VNDetectFaceRectanglesRequest()
      let textRequest = VNRecognizeTextRequest()
      textRequest.recognitionLevel = .accurate
      textRequest.usesLanguageCorrection = false
      textRequest.minimumTextHeight = 0.012
      let documentRequest = VNDetectDocumentSegmentationRequest()

      let requests: [VNRequest] = [faceRequest, textRequest, documentRequest]
      requests.forEach(Self.preferCPUOnSimulator)

      let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
      try handler.perform(requests)

      let faces: [[String: Any]] = (faceRequest.results ?? []).map { obs in
        var box = Self.box(obs.boundingBox)
        box["confidence"] = Double(obs.confidence)
        return box
      }

      let texts: [[String: Any]] = (textRequest.results ?? []).compactMap { obs in
        guard let candidate = obs.topCandidates(1).first else { return nil }
        var box = Self.box(obs.boundingBox)
        box["text"] = candidate.string
        box["confidence"] = Double(candidate.confidence)
        return box
      }

      let documents: [[String: Any]] = (documentRequest.results ?? [])
        .filter { $0.confidence > 0.6 }
        .map { obs in
          var box = Self.box(obs.boundingBox)
          box["confidence"] = Double(obs.confidence)
          return box
        }

      return [
        "width": cgImage.width,
        "height": cgImage.height,
        "faces": faces,
        "texts": texts,
        "documents": documents,
        "metadata": metadata,
        "durationMs": Int(Date().timeIntervalSince(started) * 1000),
      ]
    }

    /// Blurs the given regions and re-encodes the photo without location or device metadata.
    /// Pass an empty `regions` array to only strip that metadata.
    AsyncFunction("redact") { (uri: String, regions: [[String: Any]]) throws -> [String: Any] in
      let url = try Self.fileURL(uri)
      let image = try Self.loadNormalized(url, maxDimension: 2048)
      guard let cgImage = image.cgImage else { throw ShieldError("Could not decode the image.") }

      let width = CGFloat(cgImage.width)
      let height = CGFloat(cgImage.height)
      let original = CIImage(cgImage: cgImage)
      var output = original

      if !regions.isEmpty {
        // Mosaic first, then a heavy blur: soft to look at, unrecoverable in practice.
        let longSide = max(width, height)
        let pixellate = CIFilter(name: "CIPixellate", parameters: [
          kCIInputImageKey: original.clampedToExtent(),
          kCIInputScaleKey: longSide * 0.03,
          kCIInputCenterKey: CIVector(x: 0, y: 0),
        ])?.outputImage ?? original.clampedToExtent()
        let obscured = pixellate
          .applyingGaussianBlur(sigma: Double(longSide * 0.018))
          .cropped(to: original.extent)

        let mask = Self.mask(for: regions, size: CGSize(width: width, height: height))
        let feathered = CIImage(cgImage: mask)
          .clampedToExtent()
          .applyingGaussianBlur(sigma: Double(longSide * 0.006))
          .cropped(to: original.extent)

        output = obscured.applyingFilter("CIBlendWithMask", parameters: [
          kCIInputBackgroundImageKey: original,
          kCIInputMaskImageKey: feathered,
        ])
      }

      guard let rendered = ciContext.createCGImage(output, from: original.extent) else {
        throw ShieldError("Could not render the protected image.")
      }
      // UIImage.jpegData writes a fresh JPEG: no GPS, no camera make/model, no capture date,
      // no maker notes — only basic image properties (size, orientation, color space).
      guard let data = UIImage(cgImage: rendered).jpegData(compressionQuality: 0.88) else {
        throw ShieldError("Could not encode the protected image.")
      }

      let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("privacy-shield", isDirectory: true)
      try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
      let out = dir.appendingPathComponent("safe-\(UUID().uuidString).jpg")
      try data.write(to: out, options: .atomic)

      return [
        "uri": out.absoluteString,
        "width": rendered.width,
        "height": rendered.height,
        "metadataRemoved": Self.readMetadata(out)["hasGPS"] as? Bool == false,
      ]
    }
  }

  // MARK: - Helpers

  private static func fileURL(_ uri: String) throws -> URL {
    if let url = URL(string: uri), url.scheme != nil { return url }
    let url = URL(fileURLWithPath: uri)
    guard FileManager.default.fileExists(atPath: url.path) else { throw ShieldError("File not found.") }
    return url
  }

  /// Draws the image upright (EXIF orientation applied) at 1x, capped to `maxDimension`.
  private static func loadNormalized(_ url: URL, maxDimension: CGFloat) throws -> UIImage {
    guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else {
      throw ShieldError("Could not open the image.")
    }
    let pixelWidth = image.size.width * image.scale
    let pixelHeight = image.size.height * image.scale
    let scale = min(1, maxDimension / max(pixelWidth, pixelHeight))
    let size = CGSize(width: floor(pixelWidth * scale), height: floor(pixelHeight * scale))
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = true
    return UIGraphicsImageRenderer(size: size, format: format).image { _ in
      image.draw(in: CGRect(origin: .zero, size: size))
    }
  }

  private static func readMetadata(_ url: URL) -> [String: Any] {
    guard
      let source = CGImageSourceCreateWithURL(url as CFURL, nil),
      let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    else { return ["hasGPS": false] }

    var result: [String: Any] = ["hasGPS": false]
    if let gps = props[kCGImagePropertyGPSDictionary] as? [CFString: Any], !gps.isEmpty {
      result["hasGPS"] = true
      if let lat = gps[kCGImagePropertyGPSLatitude] as? Double { result["latitude"] = lat }
      if let lon = gps[kCGImagePropertyGPSLongitude] as? Double { result["longitude"] = lon }
    }
    if let tiff = props[kCGImagePropertyTIFFDictionary] as? [CFString: Any] {
      if let make = tiff[kCGImagePropertyTIFFMake] as? String { result["make"] = make }
      if let model = tiff[kCGImagePropertyTIFFModel] as? String { result["model"] = model }
    }
    if let exif = props[kCGImagePropertyExifDictionary] as? [CFString: Any],
       let date = exif[kCGImagePropertyExifDateTimeOriginal] as? String {
      result["takenAt"] = date
    }
    return result
  }

  /// Vision boxes are bottom-left based; JS gets top-left based boxes.
  private static func box(_ r: CGRect) -> [String: Any] {
    ["x": Double(r.minX), "y": Double(1 - r.maxY), "w": Double(r.width), "h": Double(r.height)]
  }

  private static func mask(for regions: [[String: Any]], size: CGSize) -> CGImage {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = true
    let image = UIGraphicsImageRenderer(size: size, format: format).image { ctx in
      UIColor.black.setFill()
      ctx.fill(CGRect(origin: .zero, size: size))
      UIColor.white.setFill()
      for region in regions {
        let x = (region["x"] as? Double) ?? 0
        let y = (region["y"] as? Double) ?? 0
        let w = (region["w"] as? Double) ?? 0
        let h = (region["h"] as? Double) ?? 0
        let pad = (region["padding"] as? Double) ?? 0.18
        var rect = CGRect(x: x * size.width, y: y * size.height, width: w * size.width, height: h * size.height)
        rect = rect.insetBy(dx: -rect.width * pad, dy: -rect.height * pad)
        if (region["shape"] as? String) == "ellipse" {
          UIBezierPath(ovalIn: rect).fill()
        } else {
          UIBezierPath(roundedRect: rect, cornerRadius: min(rect.width, rect.height) * 0.2).fill()
        }
      }
    }
    return image.cgImage!
  }

  /// Some Vision models can't use the Neural Engine inside the iOS Simulator.
  private static func preferCPUOnSimulator(_ request: VNRequest) {
    #if targetEnvironment(simulator)
    if #available(iOS 17.0, *) {
      guard
        let cpu = MLComputeDevice.allComputeDevices.first(where: { if case .cpu = $0 { return true } else { return false } }),
        let stages = try? request.supportedComputeStageDevices
      else { return }
      for stage in stages.keys { request.setComputeDevice(cpu, for: stage) }
    } else {
      request.usesCPUOnly = true
    }
    #endif
  }
}

struct ShieldError: LocalizedError {
  let message: String
  init(_ message: String) { self.message = message }
  var errorDescription: String? { message }
}
