# 青凪電鉄 連動盤ゲーム

架空の鉄道会社「青凪電鉄」の連動盤で、列車の交換・待避・折り返し・直通運転を扱うブラウザーゲームです。

[公開サイト](https://aonagi-railway.esteemedolive1.chatgpt.site/)

## 収録駅

| 駅 | 配線・特徴 | ページ |
| --- | --- | --- |
| 01 水瀬 | 1面2線・単線交換駅・安全側線 | `dist/minase.html` |
| 02 青葉 | 2面4線・上下本線・待避と折り返し | `dist/AOBA.html` |
| 03 汐見中央 | 4面8線・3系統・発点テコと着点ボタン | `dist/SHIOMI-CENTRAL.html` |
| 04 新凪原 | 2面3線・共用中線・青凪電鉄と翠陵電鉄の直通境界 | `dist/SHIN-NAGIHARA.html` |

## 手元で動かす

Node.js 20以上を用意し、このフォルダーで実行します。追加ライブラリーのインストールやビルドは不要です。

```sh
npm start
```

ブラウザーで `http://127.0.0.1:8765/` を開きます。終了はターミナルで Ctrl+C。ポートを変える場合は環境変数 `PORT` を指定します。

## 更新するファイル

表示は各駅のHTML・CSS、運行処理は `*-engine.js`、盤面操作は `*-app.js` に分かれています。青葉駅の処理は `station-engine.js` と `station-app.js` です。

- `dist/index.html`・`menu.css`：駅選択メニュー
- `dist/brand.css`・`light.css`・`cabinet.css`：共通デザイン
- `dist/sound.js`：操作音・接近警報
- `dist/game-clock.js`：時刻・時素の進行
- `dist/panel-input.js`・`panel-performance.css`：連打対策・分岐の表示
- `dist/navigation.js`：運行中の画面移動確認

変更後は手元で画面を確認し、次のチェックを実行してからGitHubへコミットします。

```sh
npm test
```

GitHub Actionsでも、更新とプルリクエストの際に同じチェックを実行します。鎖錠・競合進路・各駅のダイヤ・延長運転・時素・音声処理を確認します。ブラウザーでの見た目や実際の音は別途確認してください。

## 公開サイトへの反映

このGitHubリポジトリは更新用のソース管理先です。現在のChatGPT Sites公開サイトへの自動反映は設定していません。GitHubで変更しただけでは公開サイトは変わりません。公開する際は、このリポジトリの最新版を使ってSites側で更新・公開します。

別の静的ホスティングにも `dist/` を配置できます。`/AOBA`・`/SHIOMI-CENTRAL`・`/SHIN-NAGIHARA` を対応する `.html` に解決できる設定が必要です。元の `/station`・`/terminal` 用の転送ページも同梱しています。

## 補足

外部サーバー・データベース・APIキーは不要です。ゲームの状態はページ内に保持し、離れると失われます。記録は各駅のCSV保存ボタンから保存できます。

配線・運転条件・時素・ダイヤはゲーム用に簡略化した架空設定です。参考資料へのリンクは各駅の解説欄に記載しています。
