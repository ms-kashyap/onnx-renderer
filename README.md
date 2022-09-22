# ONNX Model Renderer for Azure DevOps

## One Time Setup

```powershell
npm i -g tfx-cli
npm install
```

## Build / Rebuild

```powershell
npx tfx-cli extension create
```

## Local Testing

```powershell
cd test
browserify test-local.js -o bundle.js
```

Now open `test\index.html` in a browser. Upload a model from the `test\models` folder.

## References

- [Manage Extensions](https://marketplace.visualstudio.com/manage/publishers/kashyappatel)
- [Marketplace Link](https://marketplace.visualstudio.com/items?itemName=KashyapPatel.onnx-renderer)
- [Microsoft Docs](https://learn.microsoft.com/en-us/azure/devops/extend/get-started/node?view=azure-devops)
- [Test Azure DevOps Environment](https://dev.azure.com/kpatel370/_git/KapatHacks)
