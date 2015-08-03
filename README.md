# JXcore Version Manager

> This version is under development! DO NOT USE IT!

Allows to install JXcore published binaries (available also on JXcore [download page](http://jxcore.com/downloads/))

## Installation

```bash
$ npm install -g jxvm-dev
```

OR, if you have JXcore already installed:

```bash
$ jx install -g jxvm-dev
```

In case of `Error: EACCES` try the command with `sudo`.

### Usage

Once installed, you may use `jxvm` to manage JXcore versions.

#### jxvm use <version>

Basically this command downloads given JXcore version (if it is not already downloaded) and maps it to `jx`:

```bash
$ jxvm use 237
$ jxvm use 304          // V8 by default
$ jxvm use 304 sm       // SpiderMonkey
$ jxvm use 304 sm 32    // SpiderMonkey ia32
$ jxvm use latest
```


