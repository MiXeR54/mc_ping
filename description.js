const formattingCode = /\u00C2?\u00A7([a-fklmnor0-9])/g;

class Description {
  descriptionText;

  constructor(descriptionText) {
    this.descriptionText = descriptionText;
  }

  toString() {
    return this.descriptionText;
  }

  toRaw() {
    return this.descriptionText.replace(formattingCode, "");
  }
}

module.exports = Description;
