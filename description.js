const ansi = require("ansi-styles");

const formattingCode = /\u00C2?\u00A7([a-fklmnor0-9])/g;

const ansiMap = new Map();
ansiMap.set("0", ansi.black);
ansiMap.set("1", ansi.blue);
ansiMap.set("2", ansi.green);
ansiMap.set("3", ansi.cyan);
ansiMap.set("4", ansi.red);
ansiMap.set("5", ansi.magenta);
ansiMap.set("6", ansi.yellow);
ansiMap.set("7", ansi.gray);
ansiMap.set("8", ansi.blackBright);
ansiMap.set("9", ansi.blueBright);
ansiMap.set("a", ansi.greenBright);
ansiMap.set("b", ansi.cyanBright);
ansiMap.set("c", ansi.redBright);
ansiMap.set("d", ansi.magentaBright);
ansiMap.set("e", ansi.yellowBright);
ansiMap.set("f", ansi.whiteBright);
ansiMap.set("k", ansi.reset);
ansiMap.set("l", ansi.bold);
ansiMap.set("m", ansi.strikethrough);
ansiMap.set("n", ansi.underline);
ansiMap.set("o", ansi.italic);
ansiMap.set("r", ansi.reset);

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

  toANSI() {
    return (
      this.descriptionText.replace(formattingCode, (match, p1) => {
        const value = ansiMap.get(p1);

        if (!value) return ansi.reset.open;

        return value.open;
      }) + ansi.reset.open
    );
  }
}

module.exports = Description;
