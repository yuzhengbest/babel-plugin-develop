/**
 * 自动埋点插件思路：
 * 1. 判断该源码模块是否引入tracker模块，若引入，则生成trackerImportId，若没有，则帮其引入 tracker 模块，并生成 trackerImportId
 * 2. 生成一个执行 tracker 模块的语句AST
 * 3. 判断该path节点是否有相应的注释标识，若有，则插入埋点逻辑
 * 4. 对需要埋点的节点插入埋点逻辑，此时，需要兼容两种情况，一种是BlockStatement，直接插入 埋点逻辑；另一种，则需要将源码进行替换
 */
const { declare } = require('@babel/helper-plugin-utils') // 声明一个插件
const importModule = require('@babel/helper-module-imports') // 在节点中添加一个默认导入

const hasTrackerComments = (leadingComments, targetComments) => {
  if (!leadingComments) {
    return null
  }
  if (Array.isArray(leadingComments)) {
    const res = leadingComments.filter(comment => comment.node.value.includes(targetComments))
    return res?.[0] || null
  }

  return null
}

const autoTrackPlugin = declare((api, options) => {
  api.assertVersion(7) // 声明当前插件版本

  return { // 返回一个对象
    visitor: { // 定义不同类型节点的处理方式
      Program: { // 程序节点
        enter(path, state) {
          path.traverse({ // 遍历当前的程序节点
            ImportDeclaration(curPath){ // 当遍历到当前的import 声明语句
              const requirePath = curPath.get('source').node.value // 获取当前节点的source value ，可参照 astexpoler.net 网站的AST树结构
              if (requirePath === options.trackerPath) {
                const specifiersPath = curPath.get('specifiers.0') // 该声明语句的标识路径
                state.trackerImportId = specifiersPath.get('local').toString() // 生成trackerImportId，并存储在state上

                path.stop() // 停止遍历，因为该 import 声明语句已处理完成
              }
            }
          })

          // 在上述路径遍历完成后，若发现该 Program 中的 state 中没有trackerImportId，则导入一个默认的 tracker 模块
          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, options.trackerPath, {
              nameHint: path.scope.generateUid(options.trackerPath)
            }).name
          }

          state.trackerAST = api.template.statement(`${state.trackerImportId}()`)() // 生成一个 ast 执行语句
        }
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) { // 对这四种节点类型进行处理，插入埋点逻辑
        let nodeCommentsPath = path
        if (path.isExpression()) {
          nodeCommentsPath = path.parentPath.parentPath
        }
        // 判断当前path是否函数注释节点：leadingComments
        const leadingComments = nodeCommentsPath.get('leadingComments')
        let paramCommentsPath = hasTrackerComments(leadingComments, options.trackerComment)

        if (paramCommentsPath) {
          const bodyPath = path.get('body') // 获取节点的程序体
          if (bodyPath.isBlockStatement()) { // 如果是块状声明语句，则直接插入埋点逻辑
            bodyPath.node.body.unshift(state.trackerAST)
          } else { // 如果不是块状逻辑，则重新生成一个AST，然后替换原来的AST
            const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({ PREV_BODY: bodyPath.node });
            bodyPath.replaceWith(ast)
          }
        }
      }
    }
  }
})

module.exports = autoTrackPlugin
