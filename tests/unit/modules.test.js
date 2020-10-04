const Modules = require('~/modules')
const { subModules } = Modules

const { paths, deleteIssueMutation } = require('~/enums')

const mockContext = () => ({
  github: {
    issues: {
      listForRepo: jest.fn(),
      create: jest.fn(),
      createComment: jest.fn()
    },
    repos: {
      getContent: jest.fn()
    },
    projects: {
      listForRepo: jest.fn(),
      listColumns: jest.fn(),
      createCard: jest.fn()
    },
    graphql: jest.fn()
  },
  payload: {
    comment: {
      body: `
Rodarei um comando aqui
/CriaIssues contributing
/DeleteIssues contributing
Comando rodado`
    },
    repository: {
      full_name: 'GuiDevloper/docs-next'
    },
    issue: {
      user: {
        type: 'ADMIN',
        login: 'GuiDevloper',
        author_association: 'FIRST_TIMER'
      },
      author_association: 'FIRST_TIMER'
    }
  },
  issue: ({ body }) => jest.fn().mockReturnValue(body)()
})
let context = mockContext()

const getRepoData = () => {
  return subModules.getRepoData({
    full_name: 'GuiDevloper/Dreamity'
  })
}

afterEach(() => {
  jest.restoreAllMocks()
  jest.resetModules()
})

const resetAPIMock = (context, data, APIfn) => {
  jest.spyOn(context.github[APIfn[0]], APIfn[1])
    .mockResolvedValue({ data })
}

const resetMock = (name, data = []) => {
  jest.spyOn(subModules, name)
    .mockResolvedValue(...data)
}

const runTester = async (
  name,
  returnData = [],
  expectData = [],
  input = [],
  APIargs = []
) => {
  const APIfn = name[1].split('/')
  resetAPIMock(context, returnData, APIfn)
  const result = await subModules[name[0]](...input)

  const APIMock = context.github[APIfn[0]][APIfn[1]]
  expect(APIMock).toHaveBeenCalledTimes(1)
  expect(APIMock).toHaveBeenCalledWith(...APIargs)

  expect(result).toStrictEqual(expectData)
}

test('should getRepoData', () => {
  const result = getRepoData()

  expect(result).toStrictEqual({
    owner: 'GuiDevloper',
    repo: 'Dreamity'
  })
})

test('should getIssues', async () => {
  await runTester(
    ['getIssues', 'issues/listForRepo'],
    // return from API mock
    [
      { id: 1, title: 'teste1', node_id: 'testeId1', otherData: 'other' },
      { id: 2, title: 'teste2', node_id: 'testeId2', otherData: 'other2' }
    ],
    // Final data returned
    [
      { id: 1, title: 'teste1', node_id: 'testeId1' },
      { id: 2, title: 'teste2', node_id: 'testeId2' }
    ],
    // function args
    [
      context,
      getRepoData(),
      2
    ],
    // args to API mock
    [{
      ...getRepoData(),
      state: 'all',
      per_page: 100,
      page: 2
    }]
  )
})

test('should getAllIssues', async () => {
  const data = [
    { id: 1 }, { id: 10 }
  ]
  jest.spyOn(subModules, 'getIssues')
    .mockResolvedValueOnce(data)
    .mockResolvedValueOnce([])

  const returned = await subModules.getAllIssues(mockContext(), getRepoData())
  expect(returned).toStrictEqual(data)
})

test('should getAllIssues having next page', async () => {
  const data = [
    { id: 1 }, { id: 10 }
  ]
  resetMock('getIssues', [data])

  const returned = await subModules.getAllIssues(mockContext(), getRepoData())
  expect(returned).toStrictEqual([...data, ...data])
})

test('should getCommentArg', () => {
  const returned = subModules.getCommentArg(
    mockContext(),
    '/criaissues'
  )

  expect(returned).toEqual('contributing')
})

test('should getPath by explicit arg', () => {
  jest.spyOn(subModules, 'getCommentArg').mockReturnValue('contributing')
  const returned = subModules.getPath(mockContext())

  expect(returned).toStrictEqual(paths['contributing'])
})

test('should getPath without explicit arg', () => {
  jest.spyOn(subModules, 'getCommentArg').mockReturnValue('')
  const returned = subModules.getPath(mockContext())

  expect(returned).toStrictEqual(paths['guide'])
})

test('should getFiles', async () => {
  jest.spyOn(subModules, 'getPath')
    .mockReturnValue(paths.contributing)

  context = mockContext()
  await runTester(
    ['getFiles', 'repos/getContent'],
    // return from API mock
    [
      { path: 'src/path/file1' },
      { path: 'src/path/file2.md' },
      { path: 'src/path/file3.md' },
    ],
    // Final data returned
    [
      'path/file2.md',
      'path/file3.md',
    ],
    // function args
    [
      context,
      getRepoData()
    ],
    // args to API mock
    [{
      ...getRepoData(),
      ...paths.contributing
    }]
  )
})

test('should createIssue', async () => {
  context = mockContext()
  const file = 'path/file2.md'
  const repoData = getRepoData()
  await runTester(
    ['createIssue', 'issues/create'],
    // return from API mock
    [true],
    // Final data returned
    { data: [true] },
    // function args
    [
      context,
      repoData,
      file
    ],
    // args to API mock
    [{
      ...repoData,
      title: `Traduzir "${file}"`,
      labels: ['documentation', 'help wanted'],
      body: `Link para o arquivo: [${file.split('.md')[0]}](https://github.com/${repoData.owner}/${repoData.repo}/blob/master/src/${file})`
    }]
  )
})

test('should createComment', async () => {
  context = mockContext()
  await runTester(
    ['createComment', 'issues/createComment'],
    // return from API mock
    [true],
    // Final data returned
    { data: [true] },
    // function args
    [context, `Link para o arquivo`],
    // args to API mock
    [`Link para o arquivo`]
  )
})

test('should getProject', async () => {
  jest.spyOn(subModules, 'getPath')
    .mockReturnValue(paths.contributing)

  context = mockContext()
  await runTester(
    ['getProject', 'projects/listForRepo'],
    // return from API mock
    [
      { name: 'Traduzir "guide"', otherData: 'test' },
      { name: 'Traduzir "guide/contributing"', otherData: 'test' },
    ],
    // Final data returned
    { name: 'Traduzir "guide/contributing"', otherData: 'test' },
    // function args
    [
      context,
      getRepoData()
    ],
    // args to API mock
    [{
      ...getRepoData(),
      state: 'open'
    }]
  )
})

test('should getProjectColumn', async () => {
  context = mockContext()
  await runTester(
    ['getProjectColumn', 'projects/listColumns'],
    // return from API mock
    [
      { name: 'In revision', otherData: 'test' },
      { name: 'To do', otherData: 'test' }
    ],
    // Final data returned
    { name: 'To do', otherData: 'test' },
    // function args
    [context, { id: 10 }],
    // args to API mock
    [{ project_id: 10 }]
  )
})

test('should getProjectColumn without project arg', async () => {
  context = mockContext()
  const column = await subModules.getProjectColumn(context)
  expect(column).toEqual(undefined)
})

test('should createProjectCard', async () => {
  context = mockContext()
  await runTester(
    ['createProjectCard', 'projects/createCard'],
    // return from API mock
    [true],
    // Final data returned
    { data: [true] },
    // function args
    [context, { id: 10 }, { id: 5 }],
    // args to API mock
    [{
      column_id: 10,
      content_id: 5,
      content_type: 'Issue'
    }]
  )
})

test('should createProjectCard without column arg', async () => {
  context = mockContext()
  const card = await subModules
    .createProjectCard(context, undefined, { id: 10 })
  expect(card).toEqual(undefined)
})

test('should criaIssues and comment feedback', async () => {
  let context = mockContext()
  const { repository } = context.payload
  resetMock('getAllIssues', [[
    { title: 'Traduzir "guide/introduction.md"' },
    { title: 'Traduzir "guide/contributing/introduction.md"' }
  ]])
  resetMock('getFiles', [[
    'guide/introduction.md',
    'guide/contributing/newFile.md'
  ]])
  resetMock('getProject', [{
    name: 'Traduzir "guide/contributing"',
    otherData: 'test'
  }])
  resetMock('getProjectColumn', [
    { name: 'To do', otherData: 'test' }
  ])
  resetMock('createIssue', [
    { id: 5 }
  ])
  resetMock('createProjectCard', [
    { data: [true] }
  ])
  resetMock('createComment', [
    { data: 'Created issues and comment!' }
  ])

  const result = await Modules.criaIssues(context, repository)
  expect(result).toStrictEqual({
    data: 'Created issues and comment!'
  })
})

test('should respondFirstTimer', async () => {
  let context = mockContext()
  resetMock('createComment', [
    { data: 'Commented for first-timer!' }
  ])

  const result = await Modules.respondFirstTimer(context)
  expect(result).toStrictEqual({
    data: 'Commented for first-timer!'
  })
})

test('should only respondFirstTimer', async () => {
  const returned = await Modules.respondFirstTimer({
    payload: {
      issue: {
        user: {
          type: 'Bot',
          login: 'GuiDevloper',
          author_association: 'COLLABORATOR'
        },
        author_association: 'COLLABORATOR'
      }
    }
  })
  expect(returned).toEqual(undefined)
})

test('should deleteIssues', async () => {
  let context = mockContext()
  const { repository } = context.payload
  const issueToDelete = {
    node_id: 2,
    title: 'Traduzir "guide/contributing/introduction.md"'
  }
  resetMock('getAllIssues', [[
    ...new Array(4).fill(issueToDelete),
    { title: 'Traduzir "guide/introduction.md"', node_id: 3 },
  ]])
  jest.spyOn(context.github, 'graphql').mockResolvedValue({})
  resetMock('createComment', [
    { data: 'Deleted Issues!' }
  ])

  const result = await Modules.deleteIssues(context, repository)
  expect(context.github.graphql).toHaveBeenCalledTimes(3)
  expect(context.github.graphql).toHaveBeenCalledWith(deleteIssueMutation, {
    input: {
      issueId: 2
    }
  })
  expect(result).toStrictEqual({
    data: 'Deleted Issues!'
  })
})

test(`shouldn't deleteIssues without explicit arg`, async () => {
  context = mockContext()
  const { repository } = context.payload
  const returned = await Modules.deleteIssues({
    payload: {
      comment: { body: '/DeleteIssues' },
    }
  }, repository)
  expect(returned).toEqual(true)
})

test(`shouldn't deleteIssues if there's none`, async () => {
  let context = mockContext()
  const { repository } = context.payload
  resetMock('getAllIssues', [[
    { title: 'Traduzir "guide/introduction.md"' }
  ]])
  jest.spyOn(context.github, 'graphql').mockResolvedValue({})
  resetMock('createComment', [
    { data: 'Deleted Issues!' }
  ])

  const result = await Modules.deleteIssues(context, repository)
  expect(context.github.graphql).toHaveBeenCalledTimes(0)
  expect(result).toStrictEqual({
    data: 'Deleted Issues!'
  })
})
