exports.associations = [
  'OWNER',
  'MEMBER',
  'COLLABORATOR'
]

exports.paths = {
  guide: { path: 'src/guide' },
  migration: { path: 'src/guide/migration' },
  contributing: { path: 'src/guide/contributing' },
  api: { path: 'src/api' },
  coc: { path: 'src/coc' },
  community: { path: 'src/community' },
  cookbook: { path: 'src/cookbook' },
  examples: { path: 'src/examples' },
  'style-guide': { path: 'src/style-guide' },
  'support-vuejs': { path: 'src/support-vuejs' }
}

// GraphQL mutation to delete a issue
exports.deleteIssueMutation = `
  mutation deleteIssue($input: DeleteIssueInput!) {
    deleteIssue(input: $input) {
      clientMutationId
    }
  }
`;

exports.criaIssuesMessage = (
  path, repoData, project, createdIssues
) => {
  const repoUrl = `[${path}](https://github.com/${repoData.owner}/${repoData.repo}/tree/master/${path})`

  const projectUrl = project
    ? ` e adicionei em [seu project](https://github.com/${repoData.owner}/${repoData.repo}/projects/${project.number})`
    : ''

  return `
Opa chefia, analisando arquivos e _issues_ já criadas sobre ${repoUrl}, gerei ${createdIssues} _issues_${projectUrl}!
Qualquer coisa só chamar :)`
}