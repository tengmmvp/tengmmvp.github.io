---
title: "使用 GitHub Desktop 同步 Fork 仓库并保持与上游更新一致"
date: 2025-11-21
author: "ChatGPT"
tags: ["Fork同步", "冲突", "保留提交"]
---

在基于开源项目进行二次开发或搭建个人博客时，我们通常会先 fork 一份原仓库，然后在自己的仓库上持续更新，例如发布文章、修改配置、或加入个性化功能。而与此同时，原仓库（upstream）仍然在不断更新。如果不及时同步，会导致自己的仓库逐渐落后。



为了保持项目健康、减少未来的冲突，本教程将详细记录如何使用 **GitHub Desktop** 完整同步 upstream 更新，并在同步过程中保留自己所有的提交。



---



## 一、为什么需要同步 Fork？



当你 fork 了某个开源项目后：



* 你会不断添加自己的内容（文章、配置、主题等）

* 上游作者也在持续更新（新功能、修复、优化等）



如果不保持同步：



* 新功能无法获得

* Bug 修复无法合入

* 冲突风险不断增加



因此：**定期同步 upstream 是保证 Fork 健康且可维护的关键步骤。**



---



## 二、添加 upstream 源（首次必须完成）



在 GitHub Desktop 中：



1. 打开项目

2. 上方菜单 **Repository → Repository Settings**

3. 左侧选择 **Remotes**

4. 点击 **Add** 添加一个新的远程源：



  * **Name：** upstream

  * **URL：** 原仓库地址（例如 `https://github.com/YYsuni/2025-blog-public.git`）



添加后，你将拥有：



* **origin：** 你自己的仓库

* **upstream：** 原作者的仓库



---



## 三、检查 upstream 是否有更新



在 GitHub Desktop 主界面：



1. 点击左上角 **Fetch origin**

2. 当 upstream/main 有更新时，你会看到更新提示



这时就可以开始同步流程。



---



## 四、合并 upstream/main 到你的 main



操作步骤：



1. 菜单栏 **Branch → Merge into current branch**



2. 在弹出的列表中选择：



  ```

  upstream/main

  ```



3. GitHub Desktop 会提示：



  > There will be X conflicted files when merging upstream/main into main



4. 点击 **Create a merge commit** 继续



GitHub Desktop 将开始合并操作。若没有冲突，会直接合并成功；若有冲突，则进入下一步。



---



## 五、解决冲突（Conflict Resolution）



当出现冲突时，GitHub Desktop 会显示红色提示，并展示冲突文件列表。



点击：



**Open in Visual Studio Code**



即可打开冲突文件。文件中会出现标准冲突标记：



```text

<<<<<<< HEAD

你的改动

=======

上游的新内容

>>>>>>> upstream/main

```



你需要：



1. 根据情况选择保留内容

2. 或者将两者合并

3. 删除所有冲突标记（`<<<<<<<`、`=======`、`>>>>>>>`）



保存后回到 GitHub Desktop。



---



## 六、完成合并并推送到 GitHub



回到 GitHub Desktop：



* 冲突文件会显示为已解决（绿色 ✔）

* 点击 **Commit merge** 提交此次合并

* 最后点击右上角 **Push origin** 推送到你的仓库



此时 GitHub 页面将显示：



```

This branch is ahead of upstream/main

This branch is not behind the upstream

```



表示同步完成。



---



## 七、“ahead X commits” 是否会影响后续同步？



不会影响。



“ahead X commits” 的含义是：



* 相比上游，你的仓库多了 X 次提交

* 多出来的通常是：文章更新、配置变更、GitHub App 自动提交等



这是完全正常的，不会影响：



* 同步 upstream

* Vercel 构建部署

* 仓库使用



真正会导致冲突的是：**你改动了与 upstream 相同的代码位置**，与提交次数无关。



因此：



> ahead 10 次正常，ahead 100 次也完全没有问题。



---



## 八、同步流程一键总结



以后每次同步只需要按下面流程：



1. **Fetch origin**

2. **Merge upstream/main → main**

3. 有冲突 → 用 VS Code 解决

4. **Commit merge**

5. **Push origin**

6. Vercel 自动部署



完成！你就成功同步 upstream 最新代码，同时保留了自己全部的提交与内容。



---



## 九、总结



GitHub Desktop 提供了非常友好的 UI，让 fork 同步变得简单直观。通过本文，你可以：



* 正确添加 upstream

* 及时获取上游更新

* 处理冲突

* 保留自己的所有提交

* 保持 fork 与 upstream 始终同步