const { transformFromAstSync } = require('@babel/core')
const parser = require('@babel/parser')
const autoTrackPlugin = require('./plugins/auto-track-plugin')
const fs = require('fs')
const path = require('path')

// 读取sourceCode
const sourceCode = fs.readFileSync(path.join(__dirname, './source-code.js'), {
  encoding: 'utf-8'
})

// 将源码转化为 ast
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [autoTrackPlugin, { trackerPath: 'tracker' }]
  ]
})

console.log(code)
