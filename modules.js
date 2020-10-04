const {
  paths,
  deleteIssueMutation,
  criaIssuesMessage
} = require('./enums')

// subModules object
const $s  = {}

$s.getIssues = async (context, repoData, page) => {
  let issues = await context.github.issues.listForRepo({
    ...repoData,
    state: 'all',
    per_page: 100, page
  })
  issues = issues.data.reduce((prev, issue) => ([
    ...prev,
    {
      id: issue.id,
      title: issue.title,
      node_id: issue.node_id
    }
  ]), [])
  return issues
}

$s.getAllIssues = async (context, repoData) => {
  let issues = await $s.getIssues(context, repoData, 1)

  // get possible second page of 100 issues
  let moreIssues = await $s.getIssues(context, repoData, 2)
  if (moreIssues.length > 0) {
    issues = [...issues, ...moreIssues]
  }
  return issues
}

$s.getFiles = async (context, repoData) => {
  let path = $s.getPath(context)
  let files = await context.github.repos.getContent({
    ...repoData, ...path
  })
  files = files.data
    .map(file => file.path.split('src/')[1])
    .filter(filename => filename.endsWith('.md'))
    // .splice(0, 2) // limit for tests

  return files
}

$s.createIssue = async (context, repoData, file) => {
  return context.github.issues.create({
    ...repoData,
    title: `Traduzir "${file}"`,
    labels: ['documentation', 'help wanted'],
    body: `Link para o arquivo: [${file.split('.md')[0]}](https://github.com/${repoData.owner}/${repoData.repo}/blob/master/src/${file})`
  })
}

$s.getCommentArg = (context, fnName) => {
  const { comment } = context.payload
  return comment.body
    .toLowerCase()
    .split(fnName)[1]
    .replace('\n', ' ')
    .split(' ')[1]
}

$s.getPath = (context) => {
  const path = $s.getCommentArg(context, '/criaissues')

  if (path && paths.hasOwnProperty(path)) {
    return paths[path]
  } else {
    return { path: 'src/guide' }
  }
}

$s.getRepoData = (repository) => {
  const repo = repository.full_name.split('/')
  return { owner: repo[0], repo: repo[1] }
}

$s.createComment = (context, body) => {
  return context.github.issues.createComment(
    context.issue({ body })
  )
}

$s.getProject = async (context, repoData) => {
  const { path } = $s.getPath(context)
  let project = await context.github.projects.listForRepo({
    ...repoData,
    state: 'open'
  })
  return project.data
    .find(p => {
      return p.name === `Traduzir "${path.replace('src/', '')}"`
    })
}

$s.getProjectColumn = async (context, project) => {
  if (project) {
    let column = await context.github.projects.listColumns({
      project_id: project.id
    })
    return column.data.find(c => c.name === 'To do')
  }
}

$s.createProjectCard = async (context, column, issue) => {
  if (column) {
    return context.github.projects.createCard({
      column_id: column.id,
      content_id: issue.id,
      content_type: 'Issue'
    })
  }
}

const criaIssues = async (context, repository) => {
  const repoData = $s.getRepoData(repository)

  let issues = await $s.getAllIssues(context, repoData)

  let files = await $s.getFiles(context, repoData)
  let createdIssues = 0

  let project = await $s.getProject(context, repoData)
  let column = await $s.getProjectColumn(context, project)

  for (let file of files) {
    const hasIssue = issues.find(issue => issue.title.includes(file))
    if (!hasIssue) {
      const issue = (await $s.createIssue(context, repoData, file)).data
      ++createdIssues
      await $s.createProjectCard(context, column, issue)
    }
  }

  const { path } = $s.getPath(context)

  return $s.createComment(context,
    criaIssuesMessage(path, repoData, project, createdIssues)
  )
}

const respondFirstTimer = async context => {
  const { user, author_association } = context.payload.issue
  if (user.login !== 'br-vuer[bot]' &&
    user.type !== 'Bot' &&
    author_association.includes('FIRST_TIME')
  ) {
    return $s.createComment(context, `
Olá @${user.login}!
Agradecemos por ter aberto esta issue!
Recomendo a leitura dos guias de contribuição e dou as boas vindas :)`
    )
  }
}

// FIXME: 'Viewer not authorized to delete'
const deleteIssues = async (context, repository) => {
  const repoData = $s.getRepoData(repository)

  const arg = $s.getCommentArg(context, '/deleteissues')
  if (!arg) return true

  let issues = await $s.getAllIssues(context, repoData)
  let deletedIssues = 0

  for (let issue of issues) {
    if (issue.title.includes(`${arg}/`)) {
      await context.github.graphql(deleteIssueMutation, {
        input: {
          issueId: issue.node_id
        }
      })
      ++deletedIssues
    }
    if (deletedIssues > 2) break
  }

  return $s.createComment(context, `
Ô meu array, analisando _issues_ sobre ${arg}, removi ${deletedIssues} _issues_!
Qualquer coisa só chamar :)`
  )
}

module.exports = {
  criaIssues,
  respondFirstTimer,
  deleteIssues,
  subModules: $s
}
