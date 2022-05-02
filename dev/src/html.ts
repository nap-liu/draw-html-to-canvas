export default `<div
  style="
  font-style: italic;
  /*overflow: auto;*/
  /*color: #fff;*/
  "
  id="renderTemplate"
>
  <div style="float: left;background: rgba(255,0,0,0.5)">
    float 61
    <br>
    float 62
    <span style="">
      setsocketopt函数11111
      <br>
      setsocketopt函数22222
      <br>
      setsocketopt函数33333
    </span>
    <br>
    float 63<br>
    float 64<br>
    float 65<br>
    float 65<br>
    float 66<br>
    float 67<br>
    float 68
  </div>
  <span style="background: rgba(255, 0, 255, .5);display: inline">
    错误代码1 EADDRINUSE<br>
    错误代码2 EADDRINUSE<br>
    错误代码3 EADDRINUSE<br>
    错误代码4 EADDRINUSE<br>
    错误代码5 EADDRINUSE
  </span>
</div>
<div style="background: rgba(1,139,139,0.5); color: #fff;">
  111111111<br>
  111111111
  <div style="">inner block</div>
  111111111<br>
  111111111<br>
  222222222
</div>
`
const t= `<div style="background: rgba(2,139,139,0.5); color: #eee;">
  flow flow flow<br>
  333333333<br>
  333333333<br>
  333333333<br>
  333333333
</div>
<div style="background: rgba(3,139,139,0.5); color: #fff;">
  888888888<br>
  888888888<br>
  888888888<br>
  888888888<br>
  888888888<br>
  888888888<br>
  888888888<br>
  888888888<br>
  888888888
</div>
<div style="background: rgba(3,139,139,0.5); color: #fff;">
  555555555<br>
  555555555<br>
  555555555<br>
  555555555<br>
  555555555<br>
  555555555
</div>
<div style="background: rgba(3,139,139,0.5); color: #fff;">
  444444444<br>
  444444444<br>
  444444444<br>
  444444444<br>
  444444444
</div>`

export const html3 = `<div style="width: 320px; height: 320px; border: 1px solid #f00;padding-top: 20px; padding-left: 20px">
<div style="
      width: 200px;
      height: 200px;
      /*border: 10px solid #f00;*/
      /*border-bottom: 30px solid #f00;*/
      /*border-right: 20px dashed #00f;*/
      /*border-radius: 100%;*/
      /*border-top-color: #f00;*/
      /*border-top-width: 10px;*/
      /*border-right-color: #00f;*/
      /*border-right-width: 20px;*/
      /*border-bottom-color: #000;*/
      /*border-bottom-width: 30px;*/
      /*border-left-color: #ff0;*/
      /*border-left-width: 10px;*/
      line-height: 50px;
      /*border-radius: 10px;*/
      /*text-align: center; */
      background: rgba(0,161,19,0.5);
      "></div>
</div>`
export const html2 = `<div style='border-radius: 24px; background-color: rgba(0,0,0,.3)'>
  <div className='head' style='height: 362px; position: relative'>
    <img src='http://127.0.0.1:8080/image/post-4.14-bg.png' style='width: 100%;position: absolute;left:0;top:0;'>
    <img src='http://127.0.0.1:8080/image/post-4.14-logo.png' style='width:66px;height:58px;position: absolute;left:50px;top:60px;' />
    <div className='text' style='
font-family: PingHei-Bold;
position: absolute;
left: 140px;
top: 72px;
color: #FFFFFF;
font-weight: 700;'>4月
    </div>

     <div className='desc' style='
font-family: PingFangSC-Medium;
font-size: 20px;
color: #FFFFFF;
position: absolute;
top: 154px;
left: 48px;
line-height: 36px;
font-weight: 500;'>
    <div>世间任何索取，必有代价；</div>
    <div>理想很美，</div>
    <div>却非廉价之物。</div>
    </div>
  </div>
  <div className='icon' style='position: relative;'>
    <img style='width: 124px; height: 148px; margin: -64px auto 0; display: block' src='http://127.0.0.1:8080/image/post-4.14-day.png' />
    <div class='count' style='
font-family: SFProText-Heavy;
position: absolute;
left: 0;
top: -10px;
font-size: 24px;
color: #2BC76B;
text-align: center;
font-weight: 800;'>4</div>
  </div>
  <div className='date' style='position: relative; padding-top: 38px'>
    <img style='width: 516px; height: 2px; display:block; margin: 0 auto;' src='http://127.0.0.1:8080/image/post-line.png' />
    <div class='text' style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #2BC76B;
text-align: center;
font-weight: 800;
margin-top: -10px;
'>2021.04.30</div>
  </div>
  <div className='text' style='margin-left: 185px; margin-top: 48px'>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>四月完成循环训练</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>次</span>
  </div>
  <div className='text' style='margin-left: 224px; margin-top: 10px'>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>训练完成度</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>%</span>
  </div>
  <div className='text' style='margin-left: 236px; margin-top: 10px'>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>训练占比</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>%</span>
  </div>
  <div className='text' style='margin-left: 153px; margin-top: 10px'>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>训练容量 ( 力量 ) 环比增幅</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>%</span>
  </div>
  <div className='text' style='margin-left: 224px; margin-top: 10px'>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>Best 1RM</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>KG</span>
  </div>
  <div className='text' style='margin-left: 247px; margin-top: 10px'>
    <span style='width: 6px;height: 6px;background-color: #797881;border-radius: 6px;margin-top: 8px;margin-right: 14px;'></span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>体重</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>KG</span>
  </div>
  <div className='text' style='margin-left: 247px; margin-top: 10px'>
    <span style='width: 6px;height: 6px;background-color: #797881;border-radius: 6px;margin-top: 8px;margin-right: 14px;'></span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>体脂</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>KG</span>
  </div>
  <div className='text' style='margin-left: 247px; margin-top: 10px'>
    <span style='width: 6px;height: 6px;background-color: #797881;border-radius: 6px;margin-top: 8px;margin-right: 14px;'></span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>维度</span>
    <span style='
font-family: SFProText-Heavy;
font-size: 20px;
color: #6A6A77;
margin: 3px 10px 0px;
border-bottom: 8px solid #69d17d;
font-weight: 800;'>4.2</span>
    <span style='
font-family: PingFangSC-Heavy;
font-size: 20px;
color: #6A6A77;
font-weight: 800;'>KG</span>
  </div>
  <div className='qrcode' style='margin-top: 39px'>
    <img style='width: 144px;height:144px; margin: 0 auto;display: block' src='http://127.0.0.1:8080/image/post-4.14-day.png' alt='' />
  </div>
  <div className='text' style='
font-family: PingFangSC-Regular;
font-size: 20px;
color: #6A6A77;
text-align: center;
margin-top: 24px;
margin-bottom: 54px;
font-weight: 400;'>扫码来找我 !</div>
</div>
`