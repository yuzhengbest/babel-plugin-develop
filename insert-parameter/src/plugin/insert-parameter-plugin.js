const { declare } = require('@babel/helper-plugin-utils')

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`)

const insertParameterPlugin = declare((api, options) => {
  api.assertVersion(7)

  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.isNew) {
          return
        }

        const calleeName = path.get('callee').toString()
        if (targetCalleeName.includes(calleeName)) {
          const { line, column } = path.node.loc.start
          const newNode = api.template.expression(`console.log("${state.filename || 'unknown filename'}: (${line}, ${column})")`)()
          newNode.isNew = true

          if (path.findParent(p => p.isJSXElement())) {
            path.replaceWith(api.types.arrayExpression[newNode, path.node])
            path.skip()
          } else {
            path.insertBefore(newNode)
          }
        }
      }
    }
  }
})

module.exports = insertParameterPlugin
