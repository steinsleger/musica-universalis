# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.5](https://github.com/steinsleger/musica-universalis/compare/v0.1.4...v0.1.5) (2025-11-10)


### Bug Fixes

* adjust orbit data ([f0d4ec5](https://github.com/steinsleger/musica-universalis/commit/f0d4ec5cb3cc45272a103ba30ff236e5f50ef90b))
* fix deploy issues ([7f81074](https://github.com/steinsleger/musica-universalis/commit/7f81074cb950488892a0c5ec805b7ca394980c49))
* fix og preview image ([cb6c767](https://github.com/steinsleger/musica-universalis/commit/cb6c767d634c23202ad9e12ab34dee4704820035))
* resolve linting and ts issues ([9a3c4fc](https://github.com/steinsleger/musica-universalis/commit/9a3c4fc7ceacb2c3d60d4684cc05e0ecd9e58b12))
* restore distance mode switch ([d21169d](https://github.com/steinsleger/musica-universalis/commit/d21169d21ca27afffede6ffbf996a60b9c4b128c))
* restore master volume display ([30932b1](https://github.com/steinsleger/musica-universalis/commit/30932b16cdcf740c7a5e9be58e1c2a34b2c1a3e1))
* restore toggle planetary sequence play/stop ([202420e](https://github.com/steinsleger/musica-universalis/commit/202420ec29767e978adf661e40f8c60c4bf3b0b0))


### Code Refactoring

* add audio context interaction hook ([b569512](https://github.com/steinsleger/musica-universalis/commit/b569512535bc7f5e59096ca711e9c09c693ef7b2))
* add controls context ([0aebc29](https://github.com/steinsleger/musica-universalis/commit/0aebc29bbdd0da05babd37ff9252b07351caac2a))
* add error boundaries and improve architecture ([2b4bbbe](https://github.com/steinsleger/musica-universalis/commit/2b4bbbe5fa31e316b9c678eb92589a835fac539a))
* add planet audio management hook ([05c7c42](https://github.com/steinsleger/musica-universalis/commit/05c7c427ba86b1eacd9d2b91cdd55edb28bab7d1))
* add sequence playback hook and visualization helper util ([e1ed194](https://github.com/steinsleger/musica-universalis/commit/e1ed1945554fde305229fcf32adba3ae74d9a704))
* add useGlowEffect hook ([90b3939](https://github.com/steinsleger/musica-universalis/commit/90b3939e3f3e49107b603e08bea65bfdb1b87861))
* break down components and hooks ([54080fd](https://github.com/steinsleger/musica-universalis/commit/54080fd6da5d018fae28801e5de88b800ec4065d))
* break down orbit path and planet node into new components ([8e62573](https://github.com/steinsleger/musica-universalis/commit/8e62573871320be7acc944d823c783a9f70ef7b0))
* cleanup ([0e07343](https://github.com/steinsleger/musica-universalis/commit/0e0734385239c9d3aa97d446fdf6e34561f5e587))
* consolidate audio state management ([fb37b89](https://github.com/steinsleger/musica-universalis/commit/fb37b8985584f617542b1f5fb9d709ae0b3f0bcf))
* consolidate contexts and hooks ([c90b5d0](https://github.com/steinsleger/musica-universalis/commit/c90b5d06f2ec0f9b7670810a2e1e4030c4979e83))
* consolidate hooks ([65f89f6](https://github.com/steinsleger/musica-universalis/commit/65f89f6be9a88d081aafcb5ec3221d5a764dd718))
* convert from js to ts ([d6f46f8](https://github.com/steinsleger/musica-universalis/commit/d6f46f88bab2560e1e03222a7af1f4d99f42b771))
* create audio initialization hook ([0b90f33](https://github.com/steinsleger/musica-universalis/commit/0b90f33fed59d8d6f8aad57f5fe2bfe6659b915f))
* create hook for live mode state ([9ce767d](https://github.com/steinsleger/musica-universalis/commit/9ce767d6c8b64cbf65e91736dcaf903d439e0726))
* create separate sidebar component ([4c600a3](https://github.com/steinsleger/musica-universalis/commit/4c600a3d260fc0cabe30003c6fe3f2d428e105e0))
* decompose SidebarContent, add custom hooks, add utility functions ([36a285e](https://github.com/steinsleger/musica-universalis/commit/36a285e7f5d0c3e8e59207f99650a20b96c4535a))
* delete unused elements and leftovers ([fdc4965](https://github.com/steinsleger/musica-universalis/commit/fdc4965e3eefd9dcf512166579aea3c164ae9594))
* extract control handlers, context, and frequency effects to custom hooks ([e5b0f27](https://github.com/steinsleger/musica-universalis/commit/e5b0f2798ca4f02e97de7d43f9392e81132f6783))
* extract further logic into audio utils ([727bda3](https://github.com/steinsleger/musica-universalis/commit/727bda3b104ea1a39763005bb71a5856baaef0ca))
* extract more logic from orbitalsonification to custom hooks ([995fce9](https://github.com/steinsleger/musica-universalis/commit/995fce9b992d8c7ba62ab06b6426faeccc5b8990))
* final restructure ([0807e0f](https://github.com/steinsleger/musica-universalis/commit/0807e0f1a668091dc4f5734bd3f19cff07d2d593))
* get rid of all eslint-disable comments ([f440857](https://github.com/steinsleger/musica-universalis/commit/f440857505fef6a5407fc8617daf5e130b610434))
* implement calculateBaseFrequencies and frequencyToNote hooks ([22b4649](https://github.com/steinsleger/musica-universalis/commit/22b464981f0df48839c809b76ded5f554f1b50dc))
* implement useModals and audioInitialization ([df14932](https://github.com/steinsleger/musica-universalis/commit/df14932390da50ee4b2a9da68c597afa94d0ce87))
* implement visualization context ([969c02e](https://github.com/steinsleger/musica-universalis/commit/969c02ee5ce45783ea904ebcd018bea6b3a8e1fd))
* improve effect handling in hooks ([ba256de](https://github.com/steinsleger/musica-universalis/commit/ba256de00d8e921b60d29c7155146c37b62c4254))
* improve hooks and component architecture ([4b66fc3](https://github.com/steinsleger/musica-universalis/commit/4b66fc3344b0cbfbcd7376f2ded20b360de70902))
* improve synthManager integration ([7f5893b](https://github.com/steinsleger/musica-universalis/commit/7f5893baf792e9ee3fe24918b1b3faaa60b21971))
* integrate hooks and context ([3e7c72d](https://github.com/steinsleger/musica-universalis/commit/3e7c72d6af135e3322e2b54c4147122a50e57987))
* integrate planet audio management hook ([399c408](https://github.com/steinsleger/musica-universalis/commit/399c408bf983a42dcdb915426cffc2c03732676b))
* integrate synthManager ([85fa230](https://github.com/steinsleger/musica-universalis/commit/85fa230c8fcab72a205dc0d63207fc0d6b0799db))
* integrate useFrequencyCalculation hook ([4b36a2d](https://github.com/steinsleger/musica-universalis/commit/4b36a2d234c466ef36b6aad8f89196de58f25df1))
* keep shaving down OrbitalSonification ([0d4e907](https://github.com/steinsleger/musica-universalis/commit/0d4e90734f2179b7195538557d686330cf757686))
* memoize components ([08a1bd5](https://github.com/steinsleger/musica-universalis/commit/08a1bd5524a7ebd55c2869ae399736d9358875e3))
* move logic to audio references and playback state hooks ([25450ce](https://github.com/steinsleger/musica-universalis/commit/25450cef976c7ebdbb0c830b3894e8eda7e5d124))
* optimize useSequencePlayback ([6d582f9](https://github.com/steinsleger/musica-universalis/commit/6d582f9c483ad889878ac8b7630a57c2696a68e7))
* properly address issues fixed with eslint comments ([bee19b1](https://github.com/steinsleger/musica-universalis/commit/bee19b1fc5e77b7071ee5f7cbadea857ab8862e4))
* remove leftover elements ([04106ca](https://github.com/steinsleger/musica-universalis/commit/04106caba9e21fff9a7e822bc4994e4b6ced4287))
* remove unnecessary refs ([ea97b6e](https://github.com/steinsleger/musica-universalis/commit/ea97b6e7a260e37ec1ddcdd573399df8cdec7dce))
* remove unused elements and optimize build ([26828b0](https://github.com/steinsleger/musica-universalis/commit/26828b07fe4b33ad770502c7058e1c722c954fa1))
* remove unused elements from hooks ([23a18ca](https://github.com/steinsleger/musica-universalis/commit/23a18ca9a3f9e0b2b9b5165e98ec00718977107d))
* remove unused hooks and functions ([0590dc9](https://github.com/steinsleger/musica-universalis/commit/0590dc939d6177e9cfdf67999e33706c522ff020))
* safe commit before transition ([fa24c02](https://github.com/steinsleger/musica-universalis/commit/fa24c02e94e7f7ccd797c26dce7cb0ccda94234e))
* separate layout from OrbitalSonification component ([a45d00e](https://github.com/steinsleger/musica-universalis/commit/a45d00e316befc9c00c8adfc3e5303abb9f7ebb0))
* split container and presenter ([a2ab83c](https://github.com/steinsleger/musica-universalis/commit/a2ab83c8de59eb0014a1df9083803205604f580b))
* unify frequency management ([d1c75ca](https://github.com/steinsleger/musica-universalis/commit/d1c75ca9707499d426b7b4e8f78bc52a375d3e9b))
* unify reducer and further tree-shaking ([4f49ada](https://github.com/steinsleger/musica-universalis/commit/4f49ada6d12888d5666f6342852715bb0bd0ce4d))
* upgrade deprecated methods ([ecb698d](https://github.com/steinsleger/musica-universalis/commit/ecb698d5e543186e8c44224129c00c2450cb61d4))
* upgrade React to 19.2.0 and implement useEffectEvent ([6e074dc](https://github.com/steinsleger/musica-universalis/commit/6e074dc966d9d58b767d25548d6a927824190750))

### [0.1.4](https://github.com/steinsleger/musica-universalis/compare/v0.1.3...v0.1.4) (2025-05-19)


### Code Refactoring

* reduce base frequency slider step to 0.1 ([1f58dac](https://github.com/steinsleger/musica-universalis/commit/1f58dac29f94d4df14e592d4996f021ed2d78733))


### Documentation

* update readme ([541d3df](https://github.com/steinsleger/musica-universalis/commit/541d3df016829737e5544896bf946ee5ca409be2))

### [0.1.3](https://github.com/steinsleger/musica-universalis/compare/v0.1.2...v0.1.3) (2025-05-08)


### Features

* add accessibility features ([a4dad9b](https://github.com/steinsleger/musica-universalis/commit/a4dad9b8e031443ce394bcf1c51d8098ae26aedb))
* add optimal experience alert ([19a8c90](https://github.com/steinsleger/musica-universalis/commit/19a8c90051e08e0d7c4ed069a9493b0c503feebc))


### Code Refactoring

* refactor Titius-Bode implementation ([c5b07ca](https://github.com/steinsleger/musica-universalis/commit/c5b07ca04fd79a0093d528d21df54d9e8d3062e1))


### Styling

* improve disabled styles ([7a8df1b](https://github.com/steinsleger/musica-universalis/commit/7a8df1bc1fcf06edabbde70aceba92b6a694f429))
* minor UI tweaks ([748b202](https://github.com/steinsleger/musica-universalis/commit/748b20232eec3b7895fbc7e088d559e5d07f46b3))

### [0.1.2](https://github.com/steinsleger/musica-universalis/compare/v0.1.1...v0.1.2) (2025-05-08)

### 0.1.1 (2025-05-08)


### Features

* add help modal ([bd393ae](https://github.com/steinsleger/musica-universalis/commit/bd393ae18e13d198e3c4b1e3e27b7371632e458e))
* add play sequence to floating controls ([2e938dd](https://github.com/steinsleger/musica-universalis/commit/2e938dd6cfae7104671a418ff540d9f51c50342d))
* add reverb ([e2e9d57](https://github.com/steinsleger/musica-universalis/commit/e2e9d5709a042d00de88a6ad12ba4bf2717b8239))
* make planets glow when sequence is played ([f908c75](https://github.com/steinsleger/musica-universalis/commit/f908c75784a4e1577d593fc2232cdf91dbe72396))
* modify default bf value and extend zoom range ([78da491](https://github.com/steinsleger/musica-universalis/commit/78da491892f2c5c8f2734f45a369e326d00c978c))


### Bug Fixes

* fix planet highlight on orbital sequence ([ae42955](https://github.com/steinsleger/musica-universalis/commit/ae42955716692d77b04161a39e79dfddd0dbf49d))
* fix sw update bug ([56e157c](https://github.com/steinsleger/musica-universalis/commit/56e157c92500746e9afab6cebbca18765558816f))


### Styling

* make lateral icons to stand out when sidebar is open ([ef59132](https://github.com/steinsleger/musica-universalis/commit/ef5913285bbd7f53c5f7e23b9c6a28ff52bc19ae))

## 0.1.0 (2024-03-14)

### Features

* Initial release
* PWA support with automatic updates
* Interactive planetary orbit visualization
* Real-time sonification of orbital movements
* Configurable audio parameters