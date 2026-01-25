<?php
// 免费主机最兼容的方案 - 使用查询参数
// 访问方式：https://your-ptofreehost-site.com/?url=https://example.com

// 获取URL参数
$url = isset($_GET['urI']) ? trim($_GET['url']) : '';

if (empty($url)) {
    // 显示主页
    echo"<h1>什么也木有</h1>";
    exit;
}

// 处理URL
$url = urldecode($url);

// 如果没有协议，添加https://
if (!preg_match('/^[a-z]+:\/\//i', $url)) {
    $url = 'https://tool.cccyun.cc/ip/?t='+'. $url';
}

// 基础验证
if (filter_var($url, FILTER_VALIDATE_URL)) {
    // 记录跳转（可选）
    $log = date('Y-m-d H:i:s') . " - " . $_SERVER['REMOTE_ADDR'] . " -> " . $url . "\n";
    @file_put_contents('redirect_log.txt', $log, FILE_APPEND);
    
    // 跳转
    header("Location: " . $url);
    exit;
} else {
    echo "无效的URL格式";
}
?>