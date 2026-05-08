import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = {
    body: {},
    query: {},
    params: {},
    user: { userId: 1, id: 1, level: 2 },
    ...overrides
  }
  const res = {
    _json: null,
    _status: 200,
    status(code) {
      this._status = code
      return this
    },
    json(data) {
      this._json = data
      return this
    }
  }
  return { req, res }
}

// ========== channelController ==========
import { getChannels, createChannel } from '../controllers/channelController.js'

describe('channelController', () => {
  describe('getChannels', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes()
      await getChannels(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('createChannel', () => {
    it('rejects missing name/slug', async () => {
      const { req, res } = mockReqRes({ body: {} })
      await createChannel(req, res)
      assert.equal(res._json.code, 400)
      assert.ok(res._json.message.includes('不能为空'))
    })

    it('rejects empty name', async () => {
      const { req, res } = mockReqRes({ body: { name: '', slug: '' } })
      await createChannel(req, res)
      assert.equal(res._json.code, 400)
    })
  })
})

// ========== postController ==========
import {
  getPosts, getPostDetail, createPost, updatePost,
  deletePost, togglePin, startDebateFromPost, scorePost
} from '../controllers/postController.js'

describe('postController', () => {
  describe('getPosts', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes()
      await getPosts(req, res)
      assert.equal(res._json.code, 500)
    })

    it('handles channel filter parameter', async () => {
      const { req, res } = mockReqRes({ query: { channel: 'tech', sort: 'newest' } })
      await getPosts(req, res)
      assert.equal(res._json.code, 500)
    })

    it('handles keyword search parameter', async () => {
      const { req, res } = mockReqRes({ query: { keyword: 'AI', page: '2', limit: '10' } })
      await getPosts(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('getPostDetail', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { postId: '99999' } })
      await getPostDetail(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('createPost', () => {
    it('rejects missing required fields', async () => {
      const { req, res } = mockReqRes({ body: {} })
      await createPost(req, res)
      assert.equal(res._json.code, 400)
    })

    it('rejects title too long', async () => {
      const { req, res } = mockReqRes({
        body: { channel_id: 1, title: 'x'.repeat(201), content: 'valid content here' }
      })
      await createPost(req, res)
      assert.equal(res._json.code, 400)
      assert.ok(res._json.message.includes('200'))
    })

    it('rejects content too short', async () => {
      const { req, res } = mockReqRes({
        body: { channel_id: 1, title: 'valid title', content: 'short' }
      })
      await createPost(req, res)
      assert.equal(res._json.code, 400)
      assert.ok(res._json.message.includes('10'))
    })
  })

  describe('updatePost', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({
        params: { postId: '99999' },
        body: { title: 'new title' }
      })
      await updatePost(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('deletePost', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { postId: '99999' } })
      await deletePost(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('togglePin', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { postId: '99999' } })
      await togglePin(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('startDebateFromPost', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { postId: '99999' } })
      await startDebateFromPost(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('scorePost', () => {
    it('rejects invalid score range', async () => {
      const { req, res } = mockReqRes({
        params: { postId: '1' },
        body: { logic: 11, evidence: 5, expression: 5, depth: 5 }
      })
      await scorePost(req, res)
      assert.equal(res._json.code, 400)
    })

    it('rejects missing score dimension', async () => {
      const { req, res } = mockReqRes({
        params: { postId: '1' },
        body: { logic: 5, evidence: 5 }
      })
      await scorePost(req, res)
      assert.equal(res._json.code, 400)
    })
  })
})

// ========== commentController ==========
import {
  getComments, createComment, deleteComment, upvoteComment
} from '../controllers/commentController.js'

describe('commentController', () => {
  describe('getComments', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { postId: '99999' } })
      await getComments(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('createComment', () => {
    it('rejects content too short', async () => {
      const { req, res } = mockReqRes({
        params: { postId: '1' },
        body: { content: 'ab' }
      })
      await createComment(req, res)
      assert.equal(res._json.code, 400)
    })

    it('rejects content too long', async () => {
      const { req, res } = mockReqRes({
        params: { postId: '1' },
        body: { content: 'x'.repeat(2001) }
      })
      await createComment(req, res)
      assert.equal(res._json.code, 400)
    })
  })

  describe('deleteComment', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { commentId: '99999' } })
      await deleteComment(req, res)
      assert.equal(res._json.code, 500)
    })
  })

  describe('upvoteComment', () => {
    it('handles DB unavailability gracefully', async () => {
      const { req, res } = mockReqRes({ params: { commentId: '99999' } })
      await upvoteComment(req, res)
      assert.equal(res._json.code, 500)
    })
  })
})
