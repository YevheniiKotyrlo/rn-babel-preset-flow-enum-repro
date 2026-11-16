# rn-babel-preset-flow-enum-repro

![Build](https://github.com/YevheniiKotyrlo/rn-babel-preset-flow-enum-repro/workflows/Pre%20Merge%20Checks/badge.svg)

ReproducerApp on React Native `0.90.0-nightly-20261116-a1b2862a5` (`main` at a1b2862a5), with its `babel.config.js` as the template has it, `presets: ['module:@react-native/babel-preset']`, and three files that use a Flow enum:

- `ReproducerApp/enum/Status.js` declares `export enum Status {Active, Off}` and exports `initial = Status.Active`.
- `ReproducerApp/enum/index.js` imports both and logs `Status.getName(initial)`.
- `ReproducerApp/enum/virtual-view.js` imports `VirtualViewMode` from `react-native`, whose `src/private/components/virtualview/VirtualView.js` declares the Flow enums `VirtualViewMode` and `VirtualViewRenderState`.

## Reproduce

```bash
./reproduce.sh
```

It runs `yarn install` in `ReproducerApp`, then `node reproduce.js`, which bundles `enum/index.js` with Metro and the app's `metro.config.js` (Android, release, not minified), prints the bundled `enum/Status.js` module, runs the bundle with Node and prints what it printed. It then bundles `enum/virtual-view.js` the same way and prints the lines of the bundled `VirtualView.js` that name its two enums, and whether the bundle declares them. It exits 1 while the enums' declarations are missing from both bundles and the run throws `ReferenceError: Status is not defined`, 0 once the bundle prints `Status.getName(initial): Active` and `VirtualView.js` declares both enums, and 2 when a step fails or the run ends another way.

Expected: `Status` is declared through `flow-enums-runtime`, and the bundle prints `Status.getName(initial): Active`. Seen: the bundled module reads `Status.Active` with no `Status` declared, the bundle throws `ReferenceError: Status is not defined`, and the bundled `VirtualView.js` reads `VirtualViewMode` and `VirtualViewRenderState` with neither declared.
