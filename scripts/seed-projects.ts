import { db, schema } from "../lib/prisma";

db.delete(schema.projects).run();

const projects = [
  {
    title: "数据监控报警功能",
    description: "及时监控业务关键指标，异常自动报警，快速响应排查",
    videoUrl: "/videos/数据监控报警功能.mp4",
    order: 0,
  },
  {
    title: "员工系统快速配置",
    description: "通过简洁界面快速配置员工系统，无需切换板块，效率更高",
    videoUrl: "/videos/员工系统快速配置.mp4",
    order: 1,
  },
  {
    title: "数据搜索与图形化",
    description: "多维度数据搜索，可视化图表展示，直观呈现业务数据全貌",
    videoUrl: "/videos/数据搜索与图形化.mp4",
    order: 2,
  },
  {
    title: "根据多维度数据判断优先级",
    description: "基于多维度数据分析，智能判断任务优先级，提升决策效率",
    videoUrl: "/videos/根据多维度数据判断优先级.mp4",
    order: 3,
  },
  {
    title: "利用多维表格对商品趋势进行分析",
    description: "使用飞书多维表格对电商商品数据进行趋势分析与可视化",
    videoUrl: "/videos/利用多维表格对商品趋势进行分析.mp4",
    order: 4,
  },
  {
    title: "利用多维表格进行商品数据抓取",
    description: "通过多维表格自动抓取商品数据，实现数据沉淀与自动化",
    videoUrl: "/videos/利用多维表格进行商品数据抓取.mp4",
    order: 5,
  },
];

for (const p of projects) {
  db.insert(schema.projects).values(p).run();
}

console.log(`Seeded ${projects.length} projects.`);
