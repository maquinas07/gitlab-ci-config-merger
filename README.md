Some of the code and the general inspiration to make this project comes from: https://github.com/firecow/gitlab-ci-local

That code is licensed under the MIT license, copyright notice is available in the above repository.

The rest of the project is also licensed under the MIT license, available in the LICENSE file in this repository.

Description
---
Parses one or many gitlab CI files expanding local includes and generating a merged configuration file in the selected output file (.gitlab-ci-merged.yml by default). Outputs to stdout if a `-` is passed as the output file.

Usage
---
To generate a merged file from a .gitlab-ci.yml:
```sh
glcm
```

To merge 2 files and output to stdout:
```sh
glcm -o - -- .gitlab-ci.yml .gitlab-ci-2.yml
```

Compilation
---

With yarn under linux:
```sh
yarn && yarn run build && yarn pkg-linux
```

It might work in other operating systems, though there's no build configuration and I haven't tested it.

