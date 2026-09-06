<template>
  <div class="squad-manage">
    <div class="sm-head">
      <div>
        <b>🎖️ Squad 编制数据管理</b>
        <span class="sm-status" :class="enabled ? 'on' : 'off'">
          {{ enabled ? '● 已启用数据库覆盖（前端展示此数据）' : '○ 未启用（前端展示静态数据）' }}
        </span>
        <div class="sm-meta" v-if="updatedAt">最近保存：{{ updatedAt }}</div>
      </div>
      <div class="sm-actions">
        <el-button size="small" :loading="saving" type="primary" @click="publish(true)">💾 保存并发布（启用覆盖）</el-button>
        <el-button size="small" :loading="saving" @click="publish(false)">停用覆盖（回退前端静态）</el-button>
        <el-button size="small" plain @click="resetToStatic">重置为静态底稿</el-button>
      </div>
    </div>

    <el-alert type="info" :closable="false" show-icon style="margin:10px 0">
      编辑的是「阵营信息 / 载具图片 / 载具信息 / 载具票数 / 载具数量 / 载具复活时间（选填）」。点“保存并发布”后，首页预览与 Squad 编制页将立即使用新数据。
    </el-alert>

    <template v-if="working">
      <!-- 阵营选择 + 阵营信息 -->
      <el-card shadow="never" style="margin-bottom:14px">
        <template #header>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <b>① 选择阵营</b>
            <el-select v-model="factionIdx" style="width:320px" placeholder="选择阵营">
              <el-option v-for="(f, i) in working" :key="f.code" :label="`${f.name}（${f.code}）`" :value="i" />
            </el-select>
          </div>
        </template>
        <div v-if="faction" class="sm-grid3">
          <div class="sm-field">
            <label>阵营名称（前端展示）</label>
            <el-input v-model="faction.name" size="small" />
          </div>
          <div class="sm-field">
            <label>旗帜图片 URL（载具/旗帜图片均支持本地路径或外链）</label>
            <el-input v-model="faction.flag_url" size="small" placeholder="/squad-assets/flags/usmc.png 或 https://…" />
          </div>
          <div class="sm-field">
            <label>主题色</label>
            <el-input v-model="faction.theme" size="small" placeholder="#b8860b" />
          </div>
        </div>
        <div v-if="faction" style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <img v-if="faction.flag_url" :src="faction.flag_url" class="sm-flag" alt="旗帜预览" @error="$event.target.style.visibility='hidden'" @load="$event.target.style.visibility='visible'" />
          <span class="sm-hint">阵营代码（{{ faction.code }}）不可修改，避免破坏链接与路由。</span>
        </div>
      </el-card>

      <!-- 编制选择 + 载具编辑 -->
      <el-card shadow="never">
        <template #header>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <b>② 选择编制，编辑载具</b>
            <el-select v-model="rosterIdx" style="width:340px" placeholder="选择编制" @change="ensureRosterIdx">
              <el-option v-for="(r, j) in (faction?.rosters || [])" :key="r.key" :label="`${r.name}（${r.type}）`" :value="j" />
            </el-select>
          </div>
        </template>

        <div v-if="roster" class="sm-toolbar">
          <span class="sm-hint">共 {{ roster.vehicles.length }} 类载具 · 复活时间单位为秒（选填，留空表示不限制/未配置）</span>
          <el-button size="small" type="success" plain @click="addVehicle">＋ 添加载具</el-button>
        </div>

        <el-table v-if="roster" :data="roster.vehicles" size="small" border style="width:100%">
          <el-table-column label="载具图片 URL（含预览）" min-width="240">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:8px">
                <img :src="row.icon_url" class="sm-vimg" alt="" @error="$event.target.style.visibility='hidden'" @load="$event.target.style.visibility='visible'" />
                <el-input v-model="row.icon_url" size="small" placeholder="图片路径/URL" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="载具名称" min-width="170">
            <template #default="{ row }"><el-input v-model="row.name" size="small" /></template>
          </el-table-column>
          <el-table-column label="类型" width="130">
            <template #default="{ row }"><el-input v-model="row.type" size="small" /></template>
          </el-table-column>
          <el-table-column label="备注" min-width="150">
            <template #default="{ row }"><el-input v-model="row.note" size="small" placeholder="选填" /></template>
          </el-table-column>
          <el-table-column label="数量" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.count" :min="0" size="small" controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="票数" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.tickets" :min="0" size="small" controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="复活时间(秒·选填)" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.respawn_time" :min="0" size="small" controls-position="right"
                               :value-on-clear="null" placeholder="选填" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button size="small" type="danger" text @click="removeVehicle($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="faction" description="该阵营暂无编制" />
      </el-card>
    </template>

    <el-skeleton v-else :rows="6" animated style="margin-top:12px" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSquadAdmin, saveSquadAdmin } from '../../api'
import { FACTIONS } from '../../data/squad/factions'

const clone = (x) => JSON.parse(JSON.stringify(x))

const working = ref(null)
const enabled = ref(false)
const updatedAt = ref('')
const saving = ref(false)
const factionIdx = ref(0)
const rosterIdx = ref(0)

const faction = computed(() => working.value?.[factionIdx.value] || null)
const roster = computed(() => faction.value?.rosters[rosterIdx.value] || null)

watch(factionIdx, () => {
  rosterIdx.value = 0
})

function ensureRosterIdx() {
  if (roster.value) return
  rosterIdx.value = 0
}

async function load() {
  try {
    const res = await getSquadAdmin()
    if (res && res.enabled_flag && Array.isArray(res.factions) && res.factions.length) {
      working.value = clone(res.factions)
      enabled.value = true
    } else {
      working.value = clone(FACTIONS)
      enabled.value = false
    }
    updatedAt.value = res?.updated_at ? res.updated_at.replace('T', ' ').slice(0, 19) : ''
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
    working.value = clone(FACTIONS)
    enabled.value = false
  }
}

function addVehicle() {
  if (!roster.value) return
  roster.value.vehicles.push({
    name: '新载具',
    type: '',
    category: 'logistics',
    count: 1,
    tickets: 1,
    respawn_time: null,
    initial_delay: 0,
    icon_url: '',
    note: '',
  })
}

async function removeVehicle(idx) {
  await ElMessageBox.confirm('确认删除该载具？', '删除确认', { type: 'warning' })
  roster.value.vehicles.splice(idx, 1)
}

function normalize(list) {
  for (const f of list) {
    for (const r of f.rosters || []) {
      for (const v of r.vehicles || []) {
        v.count = Math.max(0, parseInt(v.count, 10) || 0)
        v.tickets = Math.max(0, parseInt(v.tickets, 10) || 0)
        v.respawn_time = v.respawn_time === null || v.respawn_time === undefined || v.respawn_time === ''
          ? null
          : Math.max(0, parseInt(v.respawn_time, 10) || 0)
        if (!v.note) delete v.note
      }
    }
  }
  return list
}

async function publish(enable) {
  if (!working.value || !working.value.length) {
    ElMessage.warning('暂无可发布数据')
    return
  }
  saving.value = true
  try {
    const list = normalize(clone(working.value))
    const res = await saveSquadAdmin(list, enable)
    enabled.value = !!res.enabled_flag
    updatedAt.value = (res.updated_at || '').replace('T', ' ').slice(0, 19)
    ElMessage.success(enable ? '已保存并发布，前端 Squad 页面将展示新数据' : '已停用覆盖，前端回退静态数据')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function resetToStatic() {
  await ElMessageBox.confirm('将当前编辑内容重置为「静态底稿」，尚未发布不受影响。继续？', '重置确认', { type: 'warning' })
  working.value = clone(FACTIONS)
  enabled.value = false
  factionIdx.value = 0
  rosterIdx.value = 0
  ElMessage.success('已重置为静态底稿（未保存到服务器）')
}

onMounted(load)
</script>

<style scoped>
.squad-manage { font-size: 13px; }
.sm-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 4px;
}
.sm-status { margin-left: 10px; font-size: 12px; }
.sm-status.on { color: #16a34a; }
.sm-status.off { color: #909399; }
.sm-meta { margin-top: 4px; font-size: 12px; color: var(--text-muted); }
.sm-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.sm-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 16px; }
.sm-field label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.sm-flag { width: 64px; height: 42px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-light); }
.sm-hint { font-size: 12px; color: var(--text-muted); }
.sm-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.sm-vimg { width: 44px; height: 30px; object-fit: cover; border-radius: 3px; border: 1px solid var(--border-light); flex-shrink: 0; background: #f5f7fa; }
</style>
