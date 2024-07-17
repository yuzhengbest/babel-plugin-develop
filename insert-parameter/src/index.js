const { transformFromAstSync } = require('@babel/core')
const parser = require('@babel/parser')
const insertParameterPlugin = require('./plugin/insert-parameter-plugin.js')
const fs = require('fs')
const path = require('path')

// 读取sourceCode
const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8'
})

// 将源码转化为 ast
const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous'
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [insertParameterPlugin]
  ],
  parserOpts: {
    sourceType: 'unambiguous',
    plugins: ['jsx']
  }
})

console.log(code)
