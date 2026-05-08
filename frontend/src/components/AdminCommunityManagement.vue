<template>
  <div class="community-mgmt">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="帖子管理" name="posts">
        <div class="toolbar">
          <el-input v-model="postKeyword" placeholder="搜索帖子..." clearable style="width: 300px" @change="loadPosts" />
          <el-select v-model="postStatus" placeholder="状态筛选" clearable style="width: 120px" @change="loadPosts">
            <el-option label="正常" :value="0" />
            <el-option label="已删除" :value="2" />
          </el-select>
        </div>
        <el-table :data="posts" v-loading="loadingPosts" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="author_name" label="作者" width="100" />
          <el-table-column prop="channel_name" label="频道" width="80" />
          <el-table-column prop="comment_count" label="评论" width="60" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 2 ? 'danger' : row.audit_status === 1 ? 'success' : 'warning'" size="small">
                {{ row.status === 2 ? '已删' : row.audit_status === 1 ? '通过' : '待审' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button v-if="row.audit_status !== 1" size="small" type="success" @click="managePost(row.id, 'approve')">通过</el-button>
              <el-button v-if="row.status !== 2" size="small" type="danger" @click="managePost(row.id, 'delete')">删除</el-button>
              <el-button v-if="row.status === 2" size="small" @click="managePost(row.id, 'restore')">恢复</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="postTotal > 20" layout="prev, pager, next" :total="postTotal" :page-size="20" @current-change="(p) => loadPosts(p)" />
      </el-tab-pane>

      <el-tab-pane label="评论管理" name="comments">
        <div class="toolbar">
          <el-input v-model="commentKeyword" placeholder="搜索评论..." clearable style="width: 300px" @change="loadComments" />
        </div>
        <el-table :data="comments" v-loading="loadingComments" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
          <el-table-column prop="author_name" label="作者" width="100" />
          <el-table-column prop="post_title" label="所属帖子" width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_deleted ? 'danger' : 'success'" size="small">
                {{ row.is_deleted ? '已删' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button v-if="!row.is_deleted" size="small" type="danger" @click="delComment(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="commentTotal > 20" layout="prev, pager, next" :total="commentTotal" :page-size="20" @current-change="(p) => loadComments(p)" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('posts')

// Posts
const posts = ref([])
const loadingPosts = ref(false)
const postTotal = ref(0)
const postKeyword = ref('')
const postStatus = ref(undefined)

const loadPosts = async (page = 1) => {
  loadingPosts.value = true
  try {
    const params = { page, limit: 20 }
    if (postKeyword.value) params.keyword = postKeyword.value
    if (postStatus.value !== undefined && postStatus.value !== '') params.status = postStatus.value
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/posts', { params, headers: { Authorization: `Bearer ${token}` } })
    if (res.data.code === 200) {
      posts.value = res.data.data.list
      postTotal.value = res.data.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingPosts.value = false
  }
}

const managePost = async (postId, action) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/admin/posts/${postId}`, { action }, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success('操作成功')
    loadPosts()
  } catch {
    ElMessage.error('操作失败')
  }
}

// Comments
const comments = ref([])
const loadingComments = ref(false)
const commentTotal = ref(0)
const commentKeyword = ref('')

const loadComments = async (page = 1) => {
  loadingComments.value = true
  try {
    const params = { page, limit: 20 }
    if (commentKeyword.value) params.keyword = commentKeyword.value
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/admin/comments', { params, headers: { Authorization: `Bearer ${token}` } })
    if (res.data.code === 200) {
      comments.value = res.data.data.list
      commentTotal.value = res.data.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingComments.value = false
  }
}

const delComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定删除此评论？', '确认', { type: 'warning' })
    const token = localStorage.getItem('token')
    await axios.delete(`/api/admin/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success('已删除')
    loadComments()
  } catch { /* cancelled */ }
}

// Load on mount
loadPosts()
loadComments()
</script>

<style scoped>
.community-mgmt { padding: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
