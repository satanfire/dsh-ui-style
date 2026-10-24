window.__ModuleLoader__.load({
  id: '@satanfire/dsh-ui-style',
  factory(require) {
    const React = require('react');
    const MONO_FONT =
      'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Mono", "Source Code Pro", monospace';

    /* Dracula palette (draculatheme.com), with the official light variant
       Alucard for the light scheme. Registered through theme.overrideTokens
       so the theme service resolves the value for the active scheme; every
       var() below also carries the dark value as fallback. */
    const TOKENS = {
      '--dsh-ui-bg': { light: '#f8f8f2', dark: '#282a36' },
      '--dsh-ui-fg': { light: '#1f1f1f', dark: '#f8f8f2' },
      '--dsh-ui-yellow': { light: '#846e15', dark: '#f1fa8c' },
      '--dsh-ui-orange': { light: '#a34d14', dark: '#ffb86c' },
      '--dsh-ui-green': { light: '#14710a', dark: '#50fa7b' },
      '--dsh-ui-cyan': { light: '#036a96', dark: '#8be9fd' },
      '--dsh-ui-pink': { light: '#a3144d', dark: '#ff79c6' },
      '--dsh-ui-purple': { light: '#644ac9', dark: '#bd93f9' },
      '--dsh-ui-comment': { light: '#6c664b', dark: '#6272a4' },
      '--dsh-ui-user-bg': {
        light: 'rgba(100, 74, 201, 0.10)',
        dark: 'rgba(189, 147, 249, 0.12)',
      },
    };

    /* Scoped to the transcript ([data-conversation-scroll]) plus one width
       override on the composer card. Rows carry [data-chat-flow-kind]
       (user / steering / assistant-step / tool-call / ...). Colors are
       forced with !important because markdown nodes set their own color
       and would win over row-level inheritance. */
    const CSS = `
      [data-conversation-scroll],
      [data-conversation-scroll] * {
        font-family: ${MONO_FONT} !important;
        border-radius: 0 !important;
      }
      [data-conversation-scroll] {
        letter-spacing: 0.01em;
        --dsh-chat-content-width: calc(100% - 24px);
        background: var(--dsh-ui-bg, #282a36);
      }

      /* Composer: full-bleed like the transcript. Override the derived
         layout variables on the composer seat so the card and its docks
         (stats row included) widen together — widening the card element
         alone dislodges the surrounding docks. */
      [data-composer-seat] {
        --dsh-chat-content-width: calc(100% - 48px);
        --dsh-composer-card-max-width: calc(100% - 16px);
      }

      /* User prompt: terminal-input echo — purple-tinted flat block,
         purple text, stretched across the row. */
      [data-conversation-scroll] :is([data-chat-flow-kind="user"], [data-chat-flow-kind="steering"]) {
        --dsw-specific-bubble: var(--dsh-ui-user-bg, rgba(189, 147, 249, 0.12));
      }
      [data-conversation-scroll] :is([data-chat-flow-kind="user"], [data-chat-flow-kind="steering"]) > div {
        max-width: 100% !important;
        width: 100%;
        align-items: stretch !important;
      }
      [data-conversation-scroll] :is([data-chat-flow-kind="user"], [data-chat-flow-kind="steering"]) :is(p, span, li, div, blockquote) {
        color: var(--dsh-ui-purple, #bd93f9) !important;
      }

      /* Assistant output: dracula roles — fg body, purple headings,
         cyan links, pink emphasis, green inline code. */
      [data-conversation-scroll] [data-chat-flow-kind="assistant-step"] :is(p, li, blockquote) {
        color: var(--dsh-ui-fg, #f8f8f2) !important;
      }
      [data-conversation-scroll] [data-chat-flow-kind="assistant-step"] :is(h1, h2, h3, h4, h5) {
        color: var(--dsh-ui-purple, #bd93f9) !important;
      }
      [data-conversation-scroll] [data-chat-flow-kind="assistant-step"] a {
        color: var(--dsh-ui-cyan, #8be9fd) !important;
      }
      [data-conversation-scroll] [data-chat-flow-kind="assistant-step"] :is(strong, b) {
        color: var(--dsh-ui-pink, #ff79c6) !important;
      }
      [data-conversation-scroll] [data-chat-flow-kind="assistant-step"] code {
        color: var(--dsh-ui-green, #50fa7b) !important;
      }

      /* Tool/process rows: flat and dimmed, like background job lines. */
      [data-conversation-scroll] :is([data-chat-flow-kind="tool-call"], [data-chat-flow-kind="turn-process"]) {
        --dsw-alias-bg-layer-1: transparent;
      }
      [data-conversation-scroll] :is([data-chat-flow-kind="tool-call"], [data-chat-flow-kind="turn-process"]) :is(p, span, div, code) {
        color: var(--dsh-ui-comment, #6272a4) !important;
      }

      /* Balance pill: chrome only on hover, focus or while its panel is open. */
      [data-ui-style-balance-button] {
        cursor: pointer;
        font: inherit;
        font-variant-numeric: tabular-nums;
      }
      [data-ui-style-balance-button]:hover,
      [data-ui-style-balance-button][aria-expanded="true"] {
        background: var(--dsw-alias-interactive-bg-hover);
        color: var(--dsw-alias-label-secondary);
      }
      [data-ui-style-balance-button]:focus-visible,
      [data-ui-style-balance-link]:focus-visible,
      [data-ui-style-balance-refresh]:focus-visible {
        outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
        outline-offset: 1px;
      }
      [data-ui-style-balance-link] {
        color: var(--dsw-alias-brand-primary);
        text-decoration: none;
      }
      [data-ui-style-balance-link]:hover {
        text-decoration: underline;
      }
      [data-ui-style-balance-refresh] {
        color: var(--dsw-alias-label-tertiary);
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
      }
      [data-ui-style-balance-refresh]:hover {
        color: var(--dsw-alias-label-primary);
      }
    `;

    /* Cost entry for the composer dock — the row of ambient pills under the
       composer card, shared with the shipped activity and usage pills. The
       pill opens a per-provider cost panel. Each provider registers one
       reader, so a new vendor adds a data source, not another UI. */
    const COST_NS = 'uiStyle';
    const COST_DICTS = {
      zh: {
        'cost.loading': '费用 …',
        'cost.unavailable': '费用 --',
        'cost.title': '费用',
        'cost.refresh': '刷新',
        'cost.updated': '更新于 {time}',
        'cost.open': '查看费用明细',
        'cost.used': '已用 {percent}%',
        'cost.percent': '{percent}%',
        'cost.col.window': '周期',
        'cost.col.used': '已用',
        'cost.col.resets': '下次重置时间',
        'cost.window.rolling': '5 小时',
        'cost.window.weekly': '本周',
        'cost.window.monthly': '本月',
        'cost.plan.go': 'Go 订阅',
        'cost.balance': '余额',
        'cost.bonus': '赠送',
        'cost.billing': '用量与账单',
        'cost.signedOut': '未登录',
        'cost.noWallet': '无钱包',
      },
      en: {
        'cost.loading': 'Cost …',
        'cost.unavailable': 'Cost --',
        'cost.title': 'Cost',
        'cost.refresh': 'Refresh',
        'cost.updated': 'Updated {time}',
        'cost.open': 'Open cost details',
        'cost.used': '{percent}% used',
        'cost.percent': '{percent}%',
        'cost.col.window': 'Window',
        'cost.col.used': 'Used',
        'cost.col.resets': 'Next reset time',
        'cost.window.rolling': '5-hour',
        'cost.window.weekly': 'This week',
        'cost.window.monthly': 'This month',
        'cost.plan.go': 'Go plan',
        'cost.balance': 'Balance',
        'cost.bonus': 'Bonus',
        'cost.billing': 'Usage and billing',
        'cost.signedOut': 'signed out',
        'cost.noWallet': 'no wallet',
      },
    };
    const COST_REFRESH_MS = 60 * 1000;
    /* The DeepSeek account Remote carries a client identity; the Host forwards
       the version to Platform as x-client-version. */
    const CLIENT_VERSION = '0.0.0-ui-style';
    /* Host route that reads a provider quota with its stored API key. */
    const USAGE_ROUTE = '/api/dsh-ui-style/usage';
    /* Billing pages for providers whose Host does not report one. The Go
       console shows the subscription, its quota windows, and the invoices. */
    const BILLING_LINKS = {
      'opencode-go': 'https://opencode.ai/console',
    };

    /* Matches the shipped stat pills: tertiary label, tabular numerals, no
       chrome until hover or open. Host tokens keep both schemes correct. */
    const PILL_STYLE = {
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '1px 8px',
      border: 'none',
      borderRadius: 'var(--dsw-radius-sm, 6px)',
      background: 'none',
      color: 'var(--dsw-alias-label-tertiary, #8a8f98)',
      font: 'inherit',
      fontSize: 'calc(var(--dsh-content-font-size-secondary, 13px) - 1px)',
      lineHeight: 'calc(20px + var(--dsh-content-font-delta-secondary, 0px))',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    };

    /* Panel floats above the pill, inside the dock's own flow: no portal and
       no host layout assumptions. */
    const PANEL_STYLE = {
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      boxSizing: 'border-box',
      width: 'max-content',
      minWidth: '232px',
      maxWidth: 'calc(100vw - 48px)',
      padding: '10px 12px',
      border: '0.5px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.3))',
      borderRadius: 'var(--dsw-radius-md, 8px)',
      background: 'var(--dsw-alias-bg-overlay, Canvas)',
      boxShadow: 'var(--dsw-elevation-panel, 0 8px 24px rgba(0, 0, 0, 0.18))',
      color: 'var(--dsw-alias-label-primary)',
      fontSize: '12px',
      lineHeight: '18px',
      textAlign: 'left',
      fontVariantNumeric: 'tabular-nums',
    };
    const PANEL_LABEL_STYLE = { color: 'var(--dsw-alias-label-tertiary, #8a8f98)' };
    /* One hairline weight for every panel rule, so header and footer match. */
    const HAIRLINE = '0.5px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.3))';

    /** Group the integer digits of a fixed two-decimal amount. */
    function groupAmount(text) {
      const [whole, fraction] = text.split('.');
      return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
    }

    /** Format one wallet with the account page's sub-cent display rule. */
    function formatWallet(wallet) {
      const symbol = wallet.currency === 'CNY' ? '¥' : '$';
      const value = Number(wallet.balance);
      if (!Number.isFinite(value)) return `${symbol}${wallet.balance}`;
      if (value === 0) return `${symbol}0.00`;
      if (value < 0) {
        return `-${symbol}${value > -0.01 ? '0.01' : groupAmount(Math.abs(value).toFixed(2))}`;
      }
      if (value < 0.01) return `<${symbol}0.01`;
      return `${symbol}${groupAmount(value.toFixed(2))}`;
    }

    /** Local platform time for one ISO reset instant, or null when absent. */
    function resetText(iso, window) {
      if (iso === null || iso === undefined) return null;
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return null;
      const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      if (window === 'rolling') return time;
      /* Zero-padded date, so the column stays one shape across months. */
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day} ${time}`;
    }

    /** Wallet glyph drawn for both the pill and the DeepSeek panel rows. */
    function WalletGlyph() {
      return React.createElement(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 14,
          height: 14,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
        },
        React.createElement('rect', { x: 1.75, y: 3.75, width: 12.5, height: 9.25, rx: 2.25 }),
        React.createElement('circle', { cx: 11.1, cy: 8.4, r: 1.05, fill: 'currentColor', stroke: 'none' }),
      );
    }

    /** Compact failure code for a rejected Remote result. */
    function failureCode(failure) {
      return failure && failure.code ? failure.code : 'refused';
    }

    /** Read one JSON route with an empty body, tolerating a non-JSON answer. */
    async function postJson(path, body) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });
      if (!response.ok) return { ok: false, error: `http:${response.status}` };
      try {
        return await response.json();
      } catch {
        return { ok: false, error: 'protocol' };
      }
    }

    /**
     * Provider cost readers. Each one receives the Client context and answers
     * `(tr) => Promise<CostView>`, where a CostView is
     * `{ phase, summary?, rows?, link?, reason?, updatedAt? }`: `summary` is
     * the compact pill text, `rows` are `[label, value]` panel entries, and
     * `link` is `{ label, href }` for the provider's billing page. A new
     * subscription adds one entry and nothing else.
     */
    const PROVIDER_COST_READERS = {
      'deepseek-account': (ctx) => async (tr) => {
        const metadata = () => ({
          version: CLIENT_VERSION,
          locale: ctx.locale.getSnapshot().active,
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        });
        const done = (phase, extra) => ({ phase, updatedAt: Date.now(), ...extra });
        try {
          const account = await ctx.remote.account.getState();
          if (!account.ok) {
            return done('failed', { reason: `state:${failureCode(account.error)}` });
          }
          const link = { label: tr('cost.billing'), href: account.value.links.usageUrl };
          if (account.value.status === 'signed-out') {
            return done('failed', { reason: 'signed-out', summary: tr('cost.signedOut'), link });
          }
          const result = await ctx.remote.account.getBalance(metadata());
          if (!result.ok) {
            return done('failed', { reason: `balance:${failureCode(result.error)}`, link });
          }
          const details = result.value;
          if (details === null) {
            return done('failed', { reason: 'signed-out', summary: tr('cost.signedOut'), link });
          }
          if (details.status !== 'ready') {
            return done('failed', { reason: 'balance:failed', link });
          }
          const rows = [];
          for (const wallet of details.value) rows.push([tr('cost.balance'), formatWallet(wallet)]);
          for (const wallet of details.bonusWallets) {
            if (Number(wallet.balance) > 0) rows.push([tr('cost.bonus'), formatWallet(wallet)]);
          }
          if (rows.length === 0) {
            return done('failed', { reason: 'no-wallet', summary: tr('cost.noWallet'), link });
          }
          const wallets = details.value.map(formatWallet);
          const bonus = details.bonusWallets
            .filter((wallet) => Number(wallet.balance) > 0)
            .map(formatWallet);
          const label = `${tr('cost.balance')} ${wallets.join(' / ')}`;
          const summary =
            bonus.length === 0 ? label : `${label} · ${tr('cost.bonus')} ${bonus.join(' / ')}`;
          return done('ready', { summary, rows, link });
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          return done('failed', { reason: `thrown:${String(message).slice(0, 120)}` });
        }
      },

      'opencode-go': () => async (tr) => {
        const now = () => Date.now();
        let answer;
        try {
          answer = await postJson(USAGE_ROUTE, { provider: 'opencode-go' });
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          return { phase: 'failed', reason: `thrown:${String(message).slice(0, 120)}`, updatedAt: now() };
        }
        const link = BILLING_LINKS['opencode-go']
          ? { label: tr('cost.billing'), href: BILLING_LINKS['opencode-go'] }
          : undefined;
        if (answer === null || typeof answer !== 'object' || answer.ok !== true) {
          return {
            phase: 'failed',
            reason: answer && typeof answer.error === 'string' ? answer.error : 'usage-failed',
            link,
            updatedAt: now(),
          };
        }
        const usage = answer.usage ?? {};
        const rows = [];
        let monthly = null;
        for (const window of ['rolling', 'weekly', 'monthly']) {
          const entry = usage[window];
          if (entry === undefined || typeof entry.percent !== 'number') continue;
          if (window === 'monthly') monthly = entry;
          rows.push([
            tr(`cost.window.${window}`),
            tr('cost.percent', { percent: Math.round(entry.percent) }),
            resetText(entry.resetsAt, window),
          ]);
        }
        if (rows.length === 0) {
          return { phase: 'failed', reason: 'empty-usage', link, updatedAt: now() };
        }
        const head = monthly ?? usage.rolling ?? usage.weekly;
        const summary = `${tr('cost.plan.go')} ${tr('cost.used', { percent: Math.round(head.percent) })}`;
        return { phase: 'ready', summary, rows, link, updatedAt: now() };
      },
    };

    /** Route one cost read to the active provider's registered reader. */
    function readCost(ctx, provider, tr) {
      const reader = PROVIDER_COST_READERS[provider];
      if (reader === undefined) return Promise.resolve({ phase: 'failed', reason: 'unsupported-provider' });
      return Promise.resolve(reader(ctx)(tr));
    }

    /** Provider cost detail opened by the dock pill. */
    function CostPanel({ state, tr, provider, onRefresh }) {
      const rows = Array.isArray(state.rows) ? state.rows : [];
      const updated = state.updatedAt ? new Date(state.updatedAt).toLocaleTimeString() : null;
      /* Rows that carry a reset instant get a three-column table: the header
         labels the numbers once, so each row stays one line of data. */
      const columns = rows.some((row) => Array.isArray(row) && row.length > 2);
      const gridStyle = {
        display: 'grid',
        /* Percent sits right after the window label; the reset column takes
           the remaining width and stays right-aligned. */
        gridTemplateColumns: columns ? 'auto auto 1fr' : 'auto 1fr',
        columnGap: '12px',
        rowGap: '4px',
        alignItems: 'baseline',
        marginBottom: '8px',
      };
      const valueStyle = { textAlign: 'right' };
      const noteStyle = { ...PANEL_LABEL_STYLE, textAlign: 'right' };
      const headBase = {
        color: 'var(--dsw-alias-label-primary)',
        fontWeight: 600,
        fontSize: '11px',
      };
      const headStyle = { ...headBase, textAlign: 'right' };
      const header = columns
        ? [
            React.createElement('span', { key: 'head-window', style: headBase }, tr('cost.col.window')),
            React.createElement('span', { key: 'head-used', style: headStyle }, tr('cost.col.used')),
            React.createElement('span', { key: 'head-reset', style: headStyle }, tr('cost.col.resets')),
          ]
        : [];
      const body = rows.flatMap(([label, value, note], index) => {
        const cells = [
          React.createElement('span', { key: `label-${index}`, style: PANEL_LABEL_STYLE }, label),
          React.createElement('span', { key: `value-${index}`, style: valueStyle }, value),
        ];
        if (columns) {
          cells.push(React.createElement('span', { key: `note-${index}`, style: noteStyle }, note ?? ''));
        }
        return cells;
      });
      const status =
        state.phase === 'loading'
          ? tr('cost.loading')
          : state.phase === 'ready'
            ? null
            : tr('cost.unavailable');
      return React.createElement(
        'div',
        {
          style: PANEL_STYLE,
          role: 'dialog',
          'aria-label': tr('cost.title'),
          'data-ui-style-cost-panel': true,
        },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '12px',
            },
          },
          React.createElement('span', { style: { fontWeight: 600 } }, tr('cost.title')),
          provider !== null
            ? React.createElement(
                'span',
                { style: { ...PANEL_LABEL_STYLE, fontSize: '11px' } },
                provider,
              )
            : null,
        ),
        React.createElement('div', {
          style: { borderTop: HAIRLINE, margin: '6px 0' },
          'data-ui-style-cost-rule': true,
        }),
        rows.length > 0
          ? React.createElement(
              'div',
              { style: gridStyle, 'data-ui-style-cost-rows': true },
              header,
              body,
            )
          : null,
        status !== null
          ? React.createElement('div', { style: { ...PANEL_LABEL_STYLE, marginBottom: '8px' } }, status)
          : null,
        state.reason && state.phase !== 'ready'
          ? React.createElement(
              'div',
              { style: { ...PANEL_LABEL_STYLE, fontSize: '11px', marginBottom: '8px' } },
              state.reason,
            )
          : null,
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderTop: HAIRLINE,
              paddingTop: '6px',
            },
          },
          state.link
            ? React.createElement(
                'a',
                {
                  style: { color: 'var(--dsw-alias-brand-primary)', textDecoration: 'none' },
                  href: state.link.href,
                  target: '_blank',
                  rel: 'noreferrer',
                  'data-ui-style-balance-link': true,
                },
                `${state.link.label} ↗`,
              )
            : React.createElement('span', null),
          React.createElement(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
            updated !== null
              ? React.createElement(
                  'span',
                  { style: { ...PANEL_LABEL_STYLE, fontSize: '11px' } },
                  tr('cost.updated', { time: updated }),
                )
              : null,
            React.createElement(
              'button',
              { type: 'button', onClick: onRefresh, 'data-ui-style-balance-refresh': true },
              tr('cost.refresh'),
            ),
          ),
        ),
      );
    }

    /** Composer dock entry: the pill, its panel, and the shared read path. */
    function BalancePill({ readProviderCost, useProjection, t }) {
      const [state, setState] = React.useState({ phase: 'loading' });
      const [open, setOpen] = React.useState(false);
      const root = React.useRef(null);
      const selection = useProjection('modelSelection');
      const pick = selection ? (selection.next ?? selection.lastUsed) : null;
      const provider = pick ? pick.provider : null;
      const supported =
        provider !== null && Object.prototype.hasOwnProperty.call(PROVIDER_COST_READERS, provider);
      const tr = typeof t === 'function' ? t : (key) => COST_DICTS.zh[key] ?? key;

      const read = React.useCallback(() => {
        if (!supported) return;
        Promise.resolve(readProviderCost(provider, tr)).then(
          (next) => setState(next),
          (error) =>
            setState({
              phase: 'failed',
              reason: String((error && error.message) || error).slice(0, 120),
              updatedAt: Date.now(),
            }),
        );
      }, [readProviderCost, provider, supported, tr]);

      React.useEffect(() => {
        if (!supported) return undefined;
        let alive = true;
        const load = () => {
          Promise.resolve(readProviderCost(provider, tr)).then(
            (next) => {
              if (alive) setState(next);
            },
            (error) => {
              if (alive) {
                setState({
                  phase: 'failed',
                  reason: String((error && error.message) || error).slice(0, 120),
                  updatedAt: Date.now(),
                });
              }
            },
          );
        };
        load();
        /* Cost moves only when the user spends or tops up: refresh on the
           clock, on return to the tab, and whenever the model route changes. */
        const timer = window.setInterval(load, COST_REFRESH_MS);
        const onFocus = () => load();
        window.addEventListener('focus', onFocus);
        return () => {
          alive = false;
          window.clearInterval(timer);
          window.removeEventListener('focus', onFocus);
        };
      }, [readProviderCost, provider, supported, tr]);

      React.useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false);
        };
        const onPointer = (event) => {
          if (root.current !== null && !root.current.contains(event.target)) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointerdown', onPointer, true);
        return () => {
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('pointerdown', onPointer, true);
        };
      }, [open]);

      if (!supported) return null;

      const text =
        typeof state.summary === 'string' && state.summary !== ''
          ? state.summary
          : state.phase === 'loading'
            ? tr('cost.loading')
            : tr('cost.unavailable');

      return React.createElement(
        'span',
        { ref: root, style: { position: 'relative', display: 'inline-flex' } },
        React.createElement(
          'button',
          {
            type: 'button',
            style: PILL_STYLE,
            title: state.reason ? `${text} · ${state.reason}` : `${text} · ${tr('cost.open')}`,
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            'aria-label': `${text} · ${tr('cost.open')}`,
            'data-ui-style-balance': state.phase,
            'data-ui-style-balance-button': true,
            onClick: () => setOpen((value) => !value),
          },
          React.createElement(
            provider === 'opencode-go' ? PlanGlyph : WalletGlyph,
          ),
          React.createElement(
            'span',
            { style: { overflow: 'hidden', textOverflow: 'ellipsis' } },
            text,
          ),
        ),
        open
          ? React.createElement(CostPanel, { state, tr, provider, onRefresh: read })
          : null,
      );
    }

    /** Subscription glyph for providers that bill a plan, not a wallet. */
    function PlanGlyph() {
      return React.createElement(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 14,
          height: 14,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
        },
        React.createElement('circle', { cx: 8, cy: 8, r: 6.1 }),
        React.createElement('path', { d: 'M8 4.6V8l2.4 1.6' }),
      );
    }

    /* Contain one cost-pill crash so the composer dock keeps rendering its
       shipped entries; the mark reports the failure instead of hiding it. */
    class BalanceBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }

      static getDerivedStateFromError() {
        return { failed: true };
      }

      componentDidCatch(error) {
        console.error('[ui-style] cost pill crashed:', error);
      }

      render() {
        if (this.state.failed) {
          return React.createElement(
            'span',
            { style: PILL_STYLE, 'data-ui-style-balance': 'crashed' },
            '费用 !',
          );
        }
        return this.props.children;
      }
    }

    /** Registered entry: the pill under its own error boundary. */
    function BalanceEntry(props) {
      return React.createElement(BalanceBoundary, null, React.createElement(BalancePill, props));
    }

    return {
      inject: ['theme'],
      apply(ctx) {
        ctx.effect(() => {
          const removeTokens = ctx.theme.overrideTokens('@satanfire/dsh-ui-style', TOKENS);
          const style = document.createElement('style');
          style.setAttribute('data-plugin', '@satanfire/dsh-ui-style');
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => {
            removeTokens();
            style.remove();
          };
        });

        /* Composer dock: one cost pill beside the shipped activity and usage
           pills. It reads the active model provider's cost reader, so the same
           pill serves a wallet provider and a subscription provider. */
        ctx.inject(['slots', 'locale', 'remote', 'remote.account'], (ctx) => {
          for (const [locale, dict] of Object.entries(COST_DICTS)) {
            ctx.effect(
              () => ctx.locale.register(COST_NS, locale, dict),
              `ui-style: cost dictionary ${locale}`,
            );
          }
          ctx.slots.inject('conversation.composer.dock', () =>
            ctx.slots.register(
              {
                name: 'conversation.composer.dock',
                id: 'balance',
                order: 2,
                locale: COST_NS,
                inject: () => ({ readProviderCost: (provider, tr) => readCost(ctx, provider, tr) }),
              },
              BalanceEntry,
            ),
          );
        });
      },
    };
  },
});
