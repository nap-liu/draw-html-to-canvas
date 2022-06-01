
export default `<div style="position: relative; text-align: center">
  <div style="display: inline-block; text-align: center">
    <img src="/avatar.png" style="display: inline-block; border: 2px dashed #3896f8; width: 80px; height: 80px; border-radius: 100%; margin: 10px" />
    <br />
    <div style="display: inline-block; padding: 5px 10px;color: #000; border-radius: 10px; border: 2px dashed #00e;">作者：<span style="text-decoration: underline 2px #00e; color: #00e">刘喜</span></div>
    <br />
    <div style="display: inline-block; margin-top: 10px;padding: 5px 10px;color: #000; border-radius: 10px; border: 2px dashed #00e;"><span style="text-decoration: underline 2px #00e; color: #00e">一键式html到图片、完善的css样式支持</span></div>    
    <br />
    <div style="display: inline-block; margin-top: 10px;padding: 5px 10px;color: #000; border-radius: 10px; border: 2px dashed #00e;">仓库地址：<a style="text-decoration: underline 2px #00e; color: #00e" href="https://github.com/nap-liu/draw-html-to-canvas" target="_blank">https://github.com/nap-liu/draw-html-to-canvas</a></div>
  </div>
  <div style="padding-top: 10px">模拟表格</div>
  <div style="text-align: center; margin: 10px; border: 1px solid #000; border-bottom: none">
    <div style="border-bottom: 1px solid #000; overflow: hidden">
      <div style="background: #ddd; height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box;">col1</div>
      <div style="background: #ddd; height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box; border-left: 1px solid #000;">col2</div>
    </div>
    <div style="border-bottom: 1px solid #000; overflow: hidden">
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box;">cell1</div>
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box; border-left: 1px solid #000;">cell2</div>
    </div>
    <div style="border-bottom: 1px solid #000; overflow: hidden">
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box;">cell1</div>
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box; border-left: 1px solid #000;">cell2</div>
    </div>
    <div style="border-bottom: 1px solid #000; overflow: hidden">
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box;">cell1</div>
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box; border-left: 1px solid #000;">cell2</div>
    </div>
    <div style="border-bottom: 1px solid #000; overflow: hidden">
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box;">cell1</div>
      <div style="height: 40px; line-height: 40px; float: left; width: 50%; box-sizing: border-box; border-left: 1px solid #000;">cell2</div>
    </div>
  </div>
  <div style="text-align: left">
    <div style="color: #f00; text-decoration: underline">文字</div>
    <div style="background: #f00">行内<span style="background: #ccc;color: #111; font-style: italic;font-weight: bold; border-bottom: 2px solid #0f0">背景</span>文字</div>
    <div style="
        color: #333; 
        background: 
          linear-gradient(45deg, rgba(0,0,0,.1), rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%),
          linear-gradient(45deg, rgba(0,0,0,.1), rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%);
        background-position: 0 0, 10px 10px;
        background-size: 20px 20px,20px 20px; 
        height: 200px;
    ">
      <div style="float: left">float left</div>
      <div style="float: right">float right</div>
      <div style="display: inline">inline text</div>
      <div style="text-align: center; font-size: 20px">text align center</div>
      <div style="float: left">float left</div>
      <div style="float: right">float right</div>
      <div style="">block text</div>
      <div>
        <div style="float: left">float left</div>
        <div style="float: right">float right</div> 
      </div>
      <div style="clear: both">after clear block text</div>
      <div style="position: absolute; right: 0; bottom: 0">position: absolute</div>
    </div>
  </div>
</div>
<div style="overflow: hidden;">
  <div style="
      float: left;
      text-align: center; 
      line-height: 50px;
      border: 1px solid #f00; 
      border-left-color: #0f0;
      border-left-width: 10px; 
      border-top-color: #0ff; 
      border-top-width: 15px; 
      border-right-color: #00f; 
      border-right-width: 20px; 
      border-bottom-color: #ff0;
      border-bottom-width: 30px; 
      width: 50px; height: 50px;
      ">float</div>
  <div style="
      float: left;
      border: 1px solid #f00; 
      line-height: 50px;
      width: 50px; height: 50px; 
      border-radius: 10px;
      ">float</div>
  <div style="
      float: left;
      text-align: center; 
      line-height: 50px;
      border: 1px solid #f00; 
      width: 50px; height: 50px; 
      border-radius: 100%;
      ">float</div>
  <div style="
      float: left;
      text-align: right;
      line-height: 50px;
      border: 1px solid #f00; 
      border-left-color: #0f0; 
      border-top-color: #0ff; 
      border-right-color: #00f; 
      border-bottom-color: #ff0; 
      width: 50px; height: 50px;
      border-radius: 100%;
      ">float</div>
</div>

<div style="">
  <div style="
      display: inline-block;
      border: 1px solid #f00;
      line-height: 100px;
      width: 100px; height: 100px;
      border-radius: 10px;">inline-block</div>
  <div style="
      display: inline-block;
      border: 1px solid #f00; 
      text-align: center; 
      line-height: 100px;
      width: 100px; height: 100px;
      border-radius: 150%;">inline-block</div>
  <div style="
      display: inline-block;
      text-align: right; 
      line-height: 100px;
      border: 1px solid #f00; 
      border-left-color: #0f0;
      border-left-width: 10px; 
      border-top-color: #0ff; 
      border-top-width: 15px; 
      border-right-color: #00f; 
      border-right-width: 20px; 
      border-bottom-color: #ff0;
      border-bottom-width: 30px; 
      width: 100px; height: 100px;
      border-radius: 100%;
      ">inline-block</div>
   <div style="
      display: inline-block;
      text-align: right; 
      line-height: 100px;
      border: 1px solid #f00; 
      border-left-color: #0f0;
      border-left-width: 10px; 
      border-top-color: #0ff; 
      border-top-width: 15px; 
      border-right-color: #00f; 
      border-right-width: 20px; 
      border-bottom-color: #f00;
      border-bottom-width: 20px; 
      width: 100px; height: 100px;
      border-radius: 10px 20px 30px 40px / 40px 30px 20px 10px;
      ">inline-block</div>
</div>`