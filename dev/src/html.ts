/**
 *
 *
 *
 *
 *
 *
 *
 *
 **/
export default `
<div style="">
  <span style="position: relative">
    <span style="">after float2</span>
    <span style="
    position: absolute;
    z-index: 1;
    left: 0; right: 0; bottom: 0; height: 10px;
    background: #f00;" />
    <span style="
    position: absolute;
    z-index: 1;
    left: 0; right: 0; bottom: 0; height: 10px;
    background: #0f0;" />
  </span>
</div>
`

export const html5 = `<div
  style="
  /*font-style: italic;*/
  /*overflow: auto;*/
  /*color: #fff;*/
  /*display: inline-block;*/
  /*opacity: 0.4;*/
  "
  id="renderTemplate"
>
<!--  <div>333</div>-->
  <div style="float: left;background: rgba(255,0,0,0.5)">
    float 61
    <br>
    float 62
    <span style="float: right">
      setsocketopt函数11111<br>
      setsocketopt函数22222<br>
      setsocketopt函数33333<br>
      setsocketopt函数33333<br>
      setsocketopt函数33333<br>
      setsocketopt函数33333<br>
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
  <span>before</span>
  <div style="background: rgba(1,139,139,0.5); display: inline-block; color: #fff;">
    <span>aaaaaa</span><br>
    <span>aaaaaa</span><br>
    <span>aaaaaa</span><br>
    <span>aaaaaa</span><br>
    <span>aaaaaa</span>
  </div>
  <span>after</span>
</div>

<div style="background: rgba(1,139,139,0.5);color: #fff;">
  <span>con float1</span><br>
  <span>con float2</span>
</div>
<div style="text-align: center">after float1</div>
<div style="">
  <span style="position: relative">
    <span style="position: relative; z-index: 1;">after float2</span>
    <span style="
    position: absolute; 
    left: 0; right: 0; bottom: 0; height: 10px; 
    /*z-index: -1; */
    background: #f00;
    " />
  </span>
</div>`

export const html4 = `<div
  style="
    /*border: 1px solid #000;*/
    /*display: block;*/
    /* height: 100%;*/
     text-align: left;
     /*font-size: 20px;*/
     /*color: #fff;*/
     /*font-style: italic;*/
     /*line-height: 30px;*/
    /*font-family: 'PingFang SC';*/
    /*background: url('img_2.png') 10px 20px / 100px auto no-repeat,*/
    /*            #f00 url('img.png') center top / 100px auto no-repeat;*/
   /* background-size: 200px, auto auto;*/
   /* background-color: #000;*/
   /*background-image: url(img_1.png), url(logo192.png);*/
   "
  id="renderTemplate"
>
  <div style="display: inline; ">
    1
    <div style="display: inline;">
      in<br>line
      <div style="display: inline-block;">
        <div style="">
          <div style="display: inline; ">
            <span style="background: #BC8F8F; text-decoration: line-through #f00 1px; padding: 0 10px">
              setsocketopt函数 设置socket工作参数
            </span>
            <span style="background: #4169E1; padding: 0 100px;">
              该函数可以设置任意socket的所有可配置参数详细可查看手册
            </span>
            <span style="background: #A52A2A">
              设置socket address重用，如果不设置的话重启的时候会报错
            </span>
            <div
              style="
                /*height: 300px;*/
                /*width: 300px;*/
                float: right;
                color: #fff;
                margin: 5px 10px 15px 20px;
                /*background: #0f0; */
                position: relative;
                padding: 5px 10px 15px 20px;
                /*border: 20px solid rgba(0,128,0,0.5);*/
                /*border-right-width: 10px;*/
                /*border-left-color: rgba(184,134,11,0.5);*/
                /*border-right-color: rgba(65,105,225,0.5);*/
                /*border-bottom-color: rgba(225,0,0,0.5);*/
                background: rgba(0,0,0,0.3) url('img.png') left top / 100px auto no-repeat content-box;
                /*border-left-width: 20px;*/
                /*border-right-width: 150px;*/
                /*border-bottom: 1px solid #008000;*/
                /*border-bottom-width: 10px;*/
                /*border-radius: 10000px;*/
                /*border-radius: 100px 200px 50px 250px;*/
                /*border-radius: 50px 60px 70px 80px / 80px 70px 60px 50px;*/
                /*border-style: groove;*/
              "
            >float 601234789
              <span style="">
                setsocketopt123456函数
              </span>
            </div>
            <span style="background: #D2691E;">错误代码1 EADDRINUSE</span>
            <span style="background: #5F9EA0">提示信息1 Address already in use</span>
            <div style="background: #ccc;">block
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
            </div>
            <span style="background: #008B8B">
              为什么会这样呢？ 是因为TCP的连接断开后 TCP的资源并没有立即释放，而是进入了TIME_WAIT状态，该状态是为了保证TCP的可靠关闭，该状态会持续2分钟
            </span>
            <div style="
              /*background: #0f0;*/
              float: left;
              width: 200px;
              padding: 10px;
              margin: 10px;
             "
            >
              float 100
              <br>
              设置socket address重用,123456
              <div style="float: right; padding: 10px">float: right</div>
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
              设置socket address重用，如果不设置的话重启的时候会报错
            </div>
            <div style="height: 90px; float: left; background: #0f0; position: relative">
              float 120
            </div>
            <span style="background: #D2691E; ">错误代码2 EADDRINUSE</span>
            <span style="background: #5F9EA0">提示信息2 Address already in use</span>
            <div style="height: 30px; float: left; background: #0f0">float 30</div>
            <div style="height: 20px; float: left; background: #0f0">float 20</div>
            <div style="float: right; background: #f00">float 1</div>
            <div style="float: right; background: #f00">float 2</div>
            <div style="float: right; background: #f00">float 3</div>
            <span style="background: #B8860B">如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息</span>
            <span>3 inline-block</span>
            如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息
            如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息
          </div>
        </div>
        <div style="width: 200px;color: #000; text-align: center; float: left; ">
          <span style="position: relative; display: inline-block; background: rgba(0,0,0,.1)">
            position: 1
            <br>
            position: 2222
            <br>
            position: 3333333
            <div
              style="
              background: rgba(0,0,0,.2);
              left: 0px;
              right: 0px;
              top: 10px;
              bottom: 10px;
              position: absolute;
              display: inline-block;
              "
            >absolute</div>
          </span>
        </div>
        <div style="width: 10%; display: inline-block">
          5
        </div>
      </div>
    </div>
    7
  </div>
  <div style="text-align: left;">8</div>
</div>`

export const html3 = `<div style="width: 320px; height: 320px; border: 1px solid #f00;padding-top: 20px; padding-left: 20px">
<div style="
      width: 200px;
      height: 200px;
      /*opacity: .5;*/
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
      /*background-image: linear-gradient(45deg, #f00, #fff);*/
      /*background-clip: border-box;*/
      /*background-repeat: repeat;*/
      /*background-size: 50px 50px;*/
      /*background-position: 50px 10px;*/
      /*border: 1px solid #f00;*/
      /*border-radius: 100%;*/
      background: linear-gradient(45deg, #000, #000 25%, transparent 25%, transparent 75%, #000 75%) left top / 100px 100px,
        linear-gradient(45deg, #000, #000 25%, transparent 25%, transparent 75%, #000 75%) 50px 50px / 100px 100px;
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
  <div className='icon' style='position: relative; margin-top: -64px'>
    <img style='width: 124px; height: 148px; margin: 0 auto 0; display: block' src='http://127.0.0.1:8080/image/post-4.14-day.png' />
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