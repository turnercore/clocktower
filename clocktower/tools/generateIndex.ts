// @ts-nocheck
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import ts from 'typescript'

// Read directory path from command-line arguments or ask for it
let componentsDirectoryPath = process.argv[2]
if (!componentsDirectoryPath) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question(
    'Please enter the directory path (default is ../components/ui): ',
    function (inputPath) {
      componentsDirectoryPath = inputPath || '../components/ui'
      generateIndex(componentsDirectoryPath)
      rl.close()
    },
  )
} else {
  generateIndex(componentsDirectoryPath)
}

function generateIndex(directoryPath) {
  // Validate directory existence
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory ${directoryPath} does not exist`)
    process.exit(1)
  }

  //Check if directory is already indexed
  if (
    fs.existsSync(path.join(directoryPath, 'index.ts')) ||
    fs.existsSync(path.join(directoryPath, 'index.js'))
  ) {
    console.error(
      'An index.ts or index.js file already exists in the directory. Exiting.',
    )
    process.exit(1)
  }

  // Filter for TypeScript and TypeScript JSX files
  const componentFiles = fs
    .readdirSync(directoryPath)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))

  if (componentFiles.length === 0) {
    console.error(`No .ts or .tsx files found in ${directoryPath}`)
    process.exit(1)
  }

  // Initialize arrays for import and export statements
  const importStatements = []
  const exportComponents = []

  // Parse each TypeScript/TypeScript JSX file to get exported components
  componentFiles.forEach((file) => {
    const filePath = path.join(directoryPath, file)
    const fileContents = fs.readFileSync(filePath, 'utf-8')

    const sourceFile = ts.createSourceFile(
      filePath,
      fileContents,
      ts.ScriptTarget.ES2015,
      true,
    )

    const exportList = []

    ts.forEachChild(sourceFile, (node) => {
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        node.exportClause.elements.forEach((element) => {
          exportList.push(element.name.getText())
        })
      }
    })

    if (exportList.length > 0) {
      const importName = path.basename(file, path.extname(file))
      importStatements.push(
        `import { ${exportList.join(', ')} } from './${importName}'`,
      )
      exportComponents.push(...exportList)
    }
  })

  const indexContent = `// Auto-generated index.ts file
"use client"

${importStatements.join('\n')}

export {
  ${exportComponents.join(',\n  ')}
}
`

  // Write the generated content to index.ts
  fs.writeFileSync(path.join(directoryPath, 'index.ts'), indexContent)
  console.log('Finished generating index.ts')
}
