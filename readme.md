# dynamic html to canvas

使用html+css语法绘制图片到canvas上

## 采用**float**布局系统
block 独占一行  
inline-block 行内布局超长自动换行  
inline 行内布局超长自动换行  
内置了常见的标签识别  

## 支持标签

|标签支持|默认布局|默认行为|
|----|----|----|
|div|block|无|
|img|inline-block|img元素会自动加载图片|
|span|inline|无|

## 支持样式

|样式属性|有效值|特性|
|----|----|----|
|display|block\inline-block\inline|
|float|left\right|
|clear|任意值都是both|
|width|绝对值|
|height|绝对值|
|padding|绝对值|
|margin|绝对值\支持 margin: 0 auto; 居中对齐|
|position|relative\absolute|
|top|绝对值|绝对定位有效|
|right|绝对值|绝对定位有效|
|bottom|绝对值|绝对定位有效|
|left|绝对值|绝对定位有效|
|color|支持 rgba\rgb\#xxx\transparent|
|border|全功能|
|border-style|只支持 solid\dashed|
|border-radius|全功能|
|background|全功能 支持多重背景 简写、全写、支持线性渐变|
|font-style|绝对值|
|font-variant|绝对值|
|font-weight|绝对值|
|font-stretch|绝对值|
|font-size|绝对值|
|font-family|绝对值|
|text-decoration|全写、简写|
|text-decoration-color|color支持的范围|
|text-decoration-style|只支持 solid\double|
|text-decoration-thichness|绝对值|
|text-decoration-line|underline\overline\line-through|
|line-height|固定值、倍数|
|text-align|全功能|
|opacity|全功能|

## TODO

- [ ] 支持transform
- [ ] 支持z-index

## demo


