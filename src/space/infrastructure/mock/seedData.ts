import type { AppListItem } from '@/types';

export const mockApps: AppListItem[] = [
  {
    id: 'app_demo_interactive',
    name: '互动演示页',
    description: '体验变量定义、事件绑定与组件显隐控制',
    coverColor: '#2B6BFF',
    updatedAt: Date.now() - 3600_000,
    homePageId: 'page_home',
    pages: [
      {
        id: 'page_home',
        name: '首页',
        variables: [{ id: 'var_userName', name: 'userName', type: 'string', defaultValue: '朋友' }],
        components: [
          {
            id: 'n_title',
            componentId: 'text',
            name: '标题',
            props: { content: '互动演示页', level: 1, align: 'left' },
            style: {},
            size: { width: 400, height: 48 },
            children: [],
            events: [],
          },
          {
            id: 'n_input',
            componentId: 'input',
            name: '名字输入框',
            props: { label: '你的名字', placeholder: '请输入名字', required: false },
            style: {},
            size: { width: 400, height: 64 },
            children: [],
            events: [
              {
                type: 'change',
                actions: [
                  {
                    id: 'act_input_set',
                    action: 'setVariable',
                    config: { variableId: 'var_userName', variableValue: '{{$self}}' },
                  },
                ],
              },
            ],
          },
          {
            id: 'n_btn_hi',
            componentId: 'button',
            name: '打招呼按钮',
            props: { text: '打招呼', type: 'primary' },
            style: {},
            size: { width: 120, height: 40 },
            children: [],
            events: [
              {
                type: 'click',
                actions: [
                  {
                    id: 'act_btn_msg',
                    action: 'showMessage',
                    config: {
                      messageType: 'success',
                      messageText: '你好，{{userName}}！欢迎来到低代码平台',
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'n_name',
            componentId: 'text',
            name: '实时名字',
            props: { content: '当前名字：{{userName}}', level: 3, align: 'left' },
            style: {},
            size: { width: 400, height: 48 },
            children: [],
            events: [],
          },
          {
            id: 'n_btn_toggle',
            componentId: 'button',
            name: '切换提示按钮',
            props: { text: '切换提示显隐', type: 'default' },
            style: {},
            size: { width: 140, height: 40 },
            children: [],
            events: [
              {
                type: 'click',
                actions: [
                  { id: 'act_toggle', action: 'toggleComponent', config: { targetId: 'n_tip' } },
                ],
              },
            ],
          },
          {
            id: 'n_tip',
            componentId: 'text',
            name: '提示文本',
            props: { content: '这是一段可以被切换显隐的提示文本', level: 4, align: 'left' },
            style: {},
            size: { width: 400, height: 48 },
            children: [],
            events: [],
          },
        ],
      },
    ],
  },
  {
    id: 'app_demo_empty',
    name: '空白应用',
    description: '从零开始搭建',
    coverColor: '#7B61FF',
    updatedAt: Date.now() - 7200_000,
    homePageId: 'page_home',
    pages: [
      {
        id: 'page_home',
        name: '首页',
        components: [],
        variables: [],
      },
    ],
  },
];
