<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow animate-fade-in">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
        <span class="text-xl">📋</span>
        Farm Tasks
      </h3>
      <button @click="showAddTask = true" class="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
        + Add
      </button>
    </div>
    <div class="space-y-3">
      <div v-if="tasks.length === 0" class="text-center py-4 text-gray-500 text-sm">
        No tasks yet. Add one to get started!
      </div>
      <div v-for="(task, index) in tasks" :key="task.id || index" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <input type="checkbox" :checked="task.completed" @change="toggleTask(index)" class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" />
        <div class="flex-1">
          <p :class="['text-sm font-medium', task.completed ? 'line-through text-gray-500' : 'text-gray-800']">{{ task.title }}</p>
          <p class="text-xs text-gray-500">{{ task.dueDate }}</p>
        </div>
        <span :class="['text-xs px-2 py-1 rounded-full', task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600']">
          {{ task.priority }}
        </span>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showAddTask" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-green-700">📋 Add New Task</h2>
          <button @click="showAddTask = false" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        <form @submit.prevent="submitTask" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Task Title</label>
            <input v-model="taskForm.title" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Due Date</label>
            <input type="date" v-model="taskForm.due_date" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1 text-gray-700">Priority</label>
            <select v-model="taskForm.priority" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="submit" class="flex-1 bg-gradient-to-r from-green-600 to-lime-500 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-lime-600 shadow-lg transition">
              Add Task
            </button>
            <button type="button" @click="showAddTask = false" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'

const farmerStore = useFarmerStore()
const authStore = useAuthStore()

const showAddTask = ref(false)
const taskForm = ref({
  title: '',
  due_date: '',
  priority: 'medium'
})

const tasks = computed(() => farmerStore.tasks || [])

const toggleTask = async (index) => {
  const task = tasks.value[index]
  if (!task.id) return
  
  const newCompletedStatus = !task.completed
  const result = await farmerStore.updateTask(task.id, { completed: newCompletedStatus })
  
  if (result.success && authStore.currentUser?.id) {
    // Refresh farm data to get updated tasks
    await farmerStore.getFarmData(authStore.currentUser.id)
  }
}

const submitTask = async () => {
  if (!authStore.currentUser?.id) {
    alert('Please login first')
    return
  }

  const result = await farmerStore.addTask({
    farmer_id: authStore.currentUser.id,
    ...taskForm.value
  })

  if (result.success) {
    showAddTask.value = false
    taskForm.value = {
      title: '',
      due_date: '',
      priority: 'medium'
    }
    // Refresh farm data
    await farmerStore.getFarmData(authStore.currentUser.id)
  } else {
    alert('Error adding task: ' + (result.error || result.message))
  }
}
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
</style>
