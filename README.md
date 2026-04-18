# Typlica

Typst 交互式练习平台 —— 将类似 [Rustlings](https://github.com/rust-lang/rustlings) 的练习体验带到 [Typst](https://typst.app/) 的世界中。

## 特点

- **纯前端**：可部署在任何静态页面托管服务（如 GitHub Pages）
- **浏览器内编译**：使用 [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) 在浏览器中编译 Typst 代码
- **实时预览**：编辑代码后即时预览结果
- **对比检查**：内置像素级差异对比，高亮显示与参考答案的差异
- **语法高亮 & 补全**：基于 CodeMirror 6 的 Typst 语法高亮和关键字补全
- **进度保存**：自动保存代码和完成状态到 localStorage
- **移动端适配**：编辑器始终可见，预览区通过 Tab 切换当前/预期/差异视图

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物在 `dist/` 目录下。

## 添加练习

1. 在 `exercises/` 下创建新目录，如 `exercises/06-tables/`
2. 添加 `answer.typ` 文件（答案代码）
3. 在 `src/exercises.ts` 中添加练习元数据

## 项目结构

```
typlica/
├── .github/workflows/deploy.yml   # GitHub Pages 部署
├── exercises/                      # 练习题目
│   ├── preamble.typ               # 共用前置代码
│   ├── 01-hello-world/answer.typ
│   ├── 02-text-styling/answer.typ
│   ├── 03-headings/answer.typ
│   ├── 04-lists/answer.typ
│   └── 05-math/answer.typ
├── scripts/
│   └── generate-references.mjs    # 参考图片生成脚本
├── src/
│   ├── main.ts                    # 应用主入口
│   ├── compiler.ts                # typst.ts 编译封装
│   ├── editor.ts                  # CodeMirror 编辑器
│   ├── exercises.ts               # 练习数据与进度管理
│   ├── diff.ts                    # 图像差异对比
│   ├── typst-lang.ts             # Typst 语法高亮
│   └── style.css                  # 样式
└── index.html
```

## 技术栈

- [Vite](https://vitejs.dev/) — 构建工具
- [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) — 浏览器端 Typst 编译器
- [CodeMirror 6](https://codemirror.net/) — 代码编辑器（支持移动端）

## 许可

MIT
