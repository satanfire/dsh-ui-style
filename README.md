# DSH UI Style

给 **DeepSeek Harness Web** 换一套 Dracula 配色，并在输入框下方加一个**可点击的费用/余额胶囊**：显示当前模型服务商的余额或订阅额度，点开可看明细。

## 功能

### 1. Dracula 主题

- 深色用 Dracula、浅色用官方浅色变体 Alucard，通过 `theme.overrideTokens` 注册，跟随系统主题切换。
- 作用域是对话区（`[data-conversation-scroll]`）与输入框卡片宽度；按对话行的 `data-chat-flow-kind`（用户 / 工具调用 / 助手回复等）分别上色。
- 等宽字体、无圆角风格，仅影响对话区，不改设置页和其他面板。

### 2. 输入框下方的费用胶囊

- 位置：`conversation.composer.dock`，与官方的 activity、usage 胶囊同一排。
- 显示当前模型服务商的摘要：
  - **DeepSeek 账号**：钱包余额。
  - **OpenCode Go 订阅**：额度已用百分比（5 小时 / 本周 / 本月三个窗口）。
- 点击展开明细面板：三列（周期 / 已用 / 下次重置时间）、账单链接。重置时间是本窗口下一次归零的时刻。
- 切换模型时自动切换数据源；服务商不支持时胶囊不显示；读取失败时显示失败标记，不会拖垮输入框。
- 凭据只在宿主半侧读取，密钥不下发浏览器。

## 环境要求

- 已配置模型的 DSH Web，要求 **`@deepseek-ai/dsh >= 0.2.0-rc.2`**。
- Node.js **22 或更新版本**。

## 安装

从仓库本地安装：

```sh
git clone https://github.com/satanfire/dsh-ui-style.git
cd dsh-ui-style
dsh plugin --profile web add "$PWD"
```

或以依赖形式固定到某个提交：

```json
"@satanfire/dsh-ui-style": "https://codeload.github.com/satanfire/dsh-ui-style/tar.gz/<commit-sha>"
```

装完重启 `dsh web`（宿主半侧需要重启），刷新页面即可看到主题与胶囊。

## 配置

无需配置。费用数据来源由当前选中的模型服务商决定：

| 服务商 | 数据来源 |
| --- | --- |
| `deepseek-account` | 宿主 `account` 服务的余额接口 |
| `opencode-go` | 官方额度接口 `https://opencode.ai/zen/go/v1/usage`，Key 取凭据 `OPENCODE_GO_API_KEY`（或服务商配置里的 `apiKeyEnv`） |

新增服务商只需在 `client.js` 的 `PROVIDER_COST_READERS` 增加一个读取函数；需要宿主代请求时在 `index.js` 的 `READERS` 增加一条。

## 说明

- 胶囊只为“当前对话正在使用的模型”取数；没有切换模型时不会请求其他服务商。
- 额度接口有 60 秒缓存，避免频繁刷新。
- 主题是覆盖式样式，不修改 DSH 源码。

## 许可

[MIT](LICENSE)
