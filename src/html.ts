export default `<div
    style="
  border: 1px solid #000;
  display: block;
  /*height: 100%;*/
  /*white-space: nowrap;*/
   width: 600px;
   font-family: 'PingFang SC';
   "
    id="renderTemplate"
  >
<div style="
    /*position: absolute;*/
     left: 10px;
     top: 10px;
    ">absolute
    </div>
    <!--    <div style="height: 100px; width: 10%; background: #f00"></div>-->
    <div style="display: inline; background: #ff0">
      1
      <div style="display: inline">
        inline
        <div style="display: inline-block;">
          <div style="">
            <div style="display: inline">
              <span style="background: rosybrown">
                setsocketopt函数 设置socket工作参数
              </span>
              <span style="background: royalblue">
                该函数可以设置任意socket的所有可配置参数详细可查看手册
              </span>
              <span style="background: brown">
                设置socket address重用，如果不设置的话重启的时候会报错
              </span>

              <div style="height: 60px; float: left; background: #0f0; position: relative">
              float 60
              
              </div>
              <span style="background: chocolate">
                错误代码1 EADDRINUSE
              </span>
              <span style="background: cadetblue">
                提示信息1 Address already in use
              </span>
              <div style="background: #ccc">block</div>
              <span style="background: darkcyan">
                为什么会这样呢？ 是因为TCP的连接断开后 TCP的资源并没有立即释放，而是进入了TIME_WAIT状态，该状态是为了保证TCP的可靠关闭，该状态会持续2分钟
              </span>
              <div style="height: 100px; float: left; background: #0f0">float 100</div>
              <div style="height: 90px; float: left; background: #0f0; position: relative">
              float 120
           
              </div>
              <span style="background: chocolate; ">
                错误代码2 EADDRINUSE
                
                 
              </span>
              <span style="background: cadetblue">
                提示信息2 Address already in use
              </span>
              <div style="height: 30px; float: left; background: #0f0">float 30</div>
              <div style="height: 20px; float: left; background: #0f0">float 20</div>
              <div style="float: right; background: #f00">float 1</div>
              <div style="float: right; background: #f00">float 2</div>
              <div style="float: right; background: #f00">float 3</div>
              <span style="background: darkgoldenrod">
                如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息
              </span>
              <span>3 inline-block</span>
                              如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息

                如果服务器异常终止，TCP并不会直接被回收，因为TCP是一个可靠的服务，所以内核会自动维护TCP进入TIME_WAIT状态，向当前连接的客户端继续应答TCP关闭的ACK消息

            </div>
          </div>
          <div style="width: 240px">4</div>
          <div style="width: 10%; display: inline-block">
            5
            <br>
            123456
            <br>
            6
          </div>
        </div>
      </div>
      7
    </div>
    <div>8</div>
    

  </div>`