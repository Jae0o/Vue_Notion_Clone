import router from "../routes";

export default {
  namespaced: true,
  state() {
    return {
      workspaces: [],
      currentWorkspace: {},
      currentWorkspacePath: [],
    };
  },
  getters: {},
  mutations: {
    assignState(state, payload) {
      Object.keys(payload).forEach((key) => {
        state[key] = payload[key];
      });
    },
  },
  actions: {
    async createWorkspace({ dispatch }, payload = {}) {
      const { parentId } = payload;
      const workspace = await _request({
        method: "POST",
        body: JSON.stringify({
          title: "",
          parent: parentId,
        }),
      });

      await dispatch("readWorkspaces");
      router.push({
        name: "Workspace",
        params: {
          id: workspace.id,
        },
      });
    },

    async readWorkspaces({ dispatch, commit }) {
      const workspaces = await _request({
        method: "GET",
      });

      commit("assignState", {
        workspaces,
      });

      dispatch("findWorkspacePath");
      if (!workspaces.length) {
        dispatch("createWorkspace");
      }
    },

    async readWorkspace({ commit }, payload) {
      const { id } = payload;
      try {
        const workspace = await _request({
          method: "GET",
          id,
        });
        commit("assignState", {
          currentWorkspace: workspace,
        });
      } catch (e) {
        router.push("/error");
      }
    },

    async updateWorkspace({ dispatch }, payload) {
      const { id, title, content } = payload;
      await _request({
        method: "PUT",
        id,
        body: JSON.stringify({
          title,
          content,
        }),
      });
      dispatch("readWorkspaces");
    },

    async deleteWorkspace({ state, dispatch }, payload) {
      const { id } = payload;
      await _request({
        id,
        method: "DELETE",
      });

      await dispatch("readWorkspaces");
      const currentID = parseInt(router.currentRoute.value.params.id, 10);
      if (id === currentID) {
        router.push({
          name: "Workspace",
          params: {
            id: state.workspaces[0].id,
          },
        });
      }
    },
    findWorkspacePath({ state, commit }) {
      const currentWorkspaceId = parseInt(router.currentRoute.value.params.id, 10);
      function _find(workspace, parents) {
        if (currentWorkspaceId === workspace.id) {
          commit("assignState", {
            currentWorkspacePath: [...parents, workspace],
          });
        }
        if (workspace.documents) {
          workspace.documents.forEach((ws) => _find(ws, [...parents, workspace]));
        }
      }

      state.workspaces.forEach((workspace) => _find(workspace, []));
    },
  },
};

async function _request(options) {
  const { id = "" } = options;
  return await fetch(`https://kdt-frontend.programmers.co.kr/documents/${id}`, {
    ...options,
    headers: {
      "x-username": "Lee Jae Young",
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
}
