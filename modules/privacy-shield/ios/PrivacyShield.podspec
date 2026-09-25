Pod::Spec.new do |s|
  s.name           = 'PrivacyShield'
  s.version        = '1.0.0'
  s.summary        = 'On-device face, text and metadata redaction for Handful'
  s.description    = 'Detects faces, text and documents with Apple Vision and redacts them with Core Image before a photo is shared.'
  s.author         = 'Handful'
  s.homepage       = 'https://github.com/zhbozzo/handful'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'CoreImage', 'CoreML', 'ImageIO'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
