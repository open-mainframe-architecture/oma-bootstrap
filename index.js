"use strict";

const path = require('path');

const analyze = require('oma-analyze');
const archive = require('oma-archive');
const bundle = require('oma-bundle');
const constants = require('oma-constants');
const util = require('oma-util');

module.exports = (archiveModules, opts) => {
  const error = opts.silent ? null : console.error;
  const destination = opts[''][0];
  const archiveDir = `${destination}/${constants.library.preserve}`;
  const bundleDir = `${destination}/${constants.library.publish}`;
  return (opts.clean ? util.rmdir(destination) : Promise.resolve())
    .then(() => Promise.all(Object.keys(archiveModules).map(name => {
      const moduleDir = archiveModules[name];
      const version = require(`${moduleDir}/package`).version;
      const archivePath = `${archiveDir}/${name}/${version}/${constants.archive.file}.zip`;
      return util.stat(archivePath)
        .catch(() => util.openWriteStream(archivePath)
          .then(output => archive(error, [moduleDir], output)))
        .then(() => archivePath)
        ;
    })))
    .then(archivePaths => Promise.all(archivePaths.map(archivePath => {
      const analysisPath = `${path.dirname(archivePath)}/${constants.archive.file}.json`;
      return util.stat(analysisPath)
        .catch(() => util.copyJSON(analyze(archivePath), util.openWriteStream(analysisPath)))
    }))
      .then(() => archivePaths)
    )
    .then(archivePaths =>
      Promise.all(archivePaths.map(archivePath => bundle(archivePath, bundleDir)))
    )
    ;
}