# rn-babel-preset-flow-enum-repro

![Build](https://github.com/YevheniiKotyrlo/rn-babel-preset-flow-enum-repro/workflows/Pre%20Merge%20Checks/badge.svg)

ReproducerApp on React Native `0.90.0-nightly-20261116-a1b2862a5` (`main` at a1b2862a5), with its `babel.config.js` as the template has it, `presets: ['module:@react-native/babel-preset']`, and two files that use a Flow enum:

- `ReproducerApp/enum/Status.js` declares `export enum Status {Active, Off}` and exports `initial = Status.Active`.
- `ReproducerApp/enum/index.js` imports both and logs `Status.getName(initial)`.

## Reproduce

```bash
./reproduce.sh
```

It runs `yarn install` in `ReproducerApp`, then `node reproduce.js`, which bundles `enum/index.js` with Metro and the app's `metro.config.js` (Android, release, not minified), prints the bundled `enum/Status.js` module, runs the bundle with Node and prints what it printed. It exits 1 while the enum's declaration is missing from the bundle and the run throws `ReferenceError: Status is not defined`, 0 once the bundle prints `Status.getName(initial): Active`, and 2 when a step fails or the run ends another way.

Expected: `Status` is declared through `flow-enums-runtime`, and the bundle prints `Status.getName(initial): Active`. Seen: the bundled module reads `Status.Active` with no `Status` declared, and the bundle throws `ReferenceError: Status is not defined`.
