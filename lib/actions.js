/*
 * Copyright IBM Corporation 2016-2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

var debug = require('debug')('generator-swiftserver:lib:actions')
var chalk = require('chalk')
var fs = require('fs')

var projectMarker = '.swiftservergenerator-project'

/**
 * Check that the required version of Swift is installed.
 * Generate a (fatal) yeoman error if it is not.
 */
exports.ensureRequiredSwiftInstalled = function () {
  return new Promise((resolve, reject) => {
    var child = this.spawnCommand('swift', ['--version'], { stdio: 'pipe' })
    var version = null
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.stdout.on('data', (data) => {
      var match = /Swift version\s+(\d+)\.\d+/.exec(data)
      if (match) {
        version = match[1]
      }
    })
    child.on('error', (err) => {
      debug(`Could not start swift. ${err}`)
      reject(new Error(chalk.red('Could not start swift. Is it installed and on your PATH?')))
    })
    child.on('close', (code, signal) => {
      if (code) {
        this.log(chalk.yellow('swift exited with exit code ' + code))
        reject(new Error(chalk.red('Could not start swift. Is it installed and on your PATH?')))
        return
      }
      if (!version) {
        reject(new Error(chalk.red('Could not determine swift version')))
        return
      }
      if (version < '3') {
        reject(new Error(chalk.red('Swift version 3 is required for Swift Server Generator.')))
        return
      }
      resolve()
    })
  }).catch(err => this.env.error(err))
}

/**
 * Check the yeoman destinationRoot is a valid project directory.
 * Generate a (fatal) yeoman error if it is not.
 */
exports.ensureInProject = function () {
  // Ensure that we are in a valid project directory
  // Valid project directories will contain a zero-byte file created by the generator.
  if (!this.fs.exists(this.destinationPath(projectMarker))) {
    this.env.error(chalk.red('This is not a Swift Server Generator project directory.'))
  }
}

/**
 * Check the yeoman destinationRoot is not already a project directory.
 * Generate a (fatal) yeoman error if it is.
 */
exports.ensureNotInProject = function () {
  // Ensure that we are not in a valid project directory
  // Valid project directories will contain a zero-byte file created by the generator.
  if (this.fs.exists(this.destinationPath(projectMarker))) {
    this.env.error(chalk.red(this.destinationPath(), 'is already a Swift Server Generator project directory'))
  }
}

/**
 * Check if the current directory is empty.
 * Generate a (fatal) yeoman error if it is.
 */
exports.ensureEmptyDirectory = function () {
  if (fs.existsSync(this.destinationRoot())) {
    // A valid directory won't have any files/folders.
    var files = fs.readdirSync(this.destinationRoot())
    if (files.length > 0) {
      debug(`ensureEmptyDirectory found ${files.length} files: ${files}`)
      this.env.error(chalk.red(this.destinationRoot(), 'is not an empty directory'))
    }
  }
}

/**
 * Check if the current appType is CRUD
 */
exports.ensureProjectIsCrud = function () {
  // Load the config.json
  var spec = this.fs.readJSON(this.destinationPath('spec.json'))
  if (!spec) {
    this.env.error(chalk.red('Unable to read spec.json'))
  }
  // Error if appType is not correct
  if (spec.appType !== 'crud') {
    this.env.error(chalk.red(`The ${this.options.namespace} generator is not compatible with non-CRUD application types`))
  }
}
