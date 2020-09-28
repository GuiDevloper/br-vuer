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
