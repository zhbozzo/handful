import { guessCategory, guessSymbol } from '../guess';

describe('guessCategory', () => {
  it('reads the category from the title', () => {
    expect(guessCategory('Winter coat + gloves')).toBe('clothing');
    expect(guessCategory('Bus fare to a hospital appointment')).toBe('transport');
    expect(guessCategory('A month of food for Toby the dog')).toBe('animals');
    expect(guessCategory('Prescribed medication, 1 month')).toBe('health');
  });

  it('falls back to later texts, then to nothing', () => {
    expect(guessCategory('Help for Friday', 'Sleeping bag')).toBe('shelter');
    expect(guessCategory('Help for Friday')).toBeUndefined();
  });

  it('matches whole words only', () => {
    // "scarf" must not match inside "scarfed", "bus" not inside "business"
    expect(guessCategory('Small business kit')).toBeUndefined();
  });
});

describe('guessSymbol', () => {
  it('picks an icon per budget line', () => {
    expect(guessSymbol('Thermal socks ×2', 'tag.fill')).toBe('snowflake');
    expect(guessSymbol('Hot meal', 'tag.fill')).toBe('fork.knife');
    expect(guessSymbol('Winter coat', 'tag.fill')).toBe('tshirt.fill');
    expect(guessSymbol('Something else', 'tag.fill')).toBe('tag.fill');
  });
});
