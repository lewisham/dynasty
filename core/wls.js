"use strict";
//-----------------------------------------------------
// 分段符
//-----------------------------------------------------

// 核心
window.wls =
{
    init: function()
    {
        this.warn("初始化wls");
        this.rpd = 180 / Math.PI;
        this.dpr = Math.PI / 180;
    },

    StartLoadStuidoCheck: function()
    {
        this.LoadStudioCnt = 0;
    },

    IsLoadStudioDone: function()
    {
        return this.LoadStudioCnt < 1;
    },

    CreateMask: function(target, opacity, block)
    {
        if (opacity == null) { opacity = 168; }
        if (block == null) { block = true; }
        var mask = ccui.Layout.create()
        target.addChild(mask, -100)
        mask.setContentSize(display.width, display.height)
        mask.setBackGroundColor(cc.c3b(0, 0, 0))
        mask.setBackGroundColorOpacity(opacity)
        mask.setBackGroundColorType(1)
        mask.setTouchEnabled(block);
        target.grayMask = mask
        return mask
    },

    // 加载studio工程文件
    LoadStudioNode: function(filename, target)
    {
        var ret = ccs.load(this.PreUrl + filename, this.PreUrl);
        var ccnode = ret.node
        if (target)
        {
            target.newScale = 1
            this.BindUI(ccnode, target);
            if (ret.action)
            {
                target.inner_action = ret.action;
                ccnode.runAction(ret.action);
            }
        }
        if (ret.action) { ccnode.inner_action = ret.action; } 
        return ccnode;
    },

    // 加载弹窗界面
    LoadPopupView: function(filename, target)
    {
        var ccnode = this.LoadStudioNode(filename, target);
        ccnode.setScale(wls.MinScale);
        if (target) { target.newScale = wls.MinScale }
        return ccnode
    },

    // 加载studio工程文件
    LoadStudioLayout: function(filename, target)
    {
        var ccnode = this.LoadStudioNode(filename, target);
        var layout = ccui.Layout.create();
        var list = [];
        for (var i = 0; i < ccnode.childrenCount; i++)
        {
            list.push(ccnode.children[i]);
        }
        for (var i = 0; i < list.length; i++)
        {
            var obj = list[i];
            obj.retain();
            obj.removeFromParent(false);
            layout.addChild(obj);
            obj.release();
        }
        return layout;
    },

    // 加载cell
    LoadCell: function(filename, target)
    {
        return this.LoadStudioNode(filename, target);
    },

    // 加载并创建粒子
    LoadParticle: function(plist, cf)
    {
        var l = [];
        plist = wls.CheckPath(plist);
        l.push(plist);
        //l.push(plist.replace(".plist", ".png"));
        cc.loader.load(l, function() {
            var emitter = cc.ParticleSystem.create(plist);
            if (cf) cf(emitter);
        });
    },

    // 绑定结点
    BindUI: function(node, target)
    {
        for (var i = 0; i < node.childrenCount; i++)
        {
            var obj = node.children[i];
            var name = obj.getName();
            if (obj._className == "Button")
            {
                this.BindBtnEvent(obj, name, target);
            }
            else if(obj._className == "ScrollView")
            {
                obj.setScrollBarEnabled(false);
            }
            if (obj.childrenCount > 0)
            {
                this.BindUI(obj, target);
            }
            target[name] = obj;
        }
    },

    // 绑定按扭事件
    BindBtnEvent: function(btn, name, target)
    {
        btn.addTouchEventListener(function(sender, type) {
            // if (type == ccui.Widget.TOUCH_BEGAN)
            // {
            //     sender._orginScale = sender.getScale();
            //     sender.setScale(sender._orginScale * 1.1);
            // }
            // else if (type == ccui.Widget.TOUCH_ENDED)
            // {
            //     sender.setScale(sender._orginScale);
            // }
            if (type == ccui.Widget.TOUCH_ENDED)
            {
                var callbackName = "click_" + name;
                var s = target.find ? target.find("SCSound") : null;
                if (target[callbackName])
                {
                    target[callbackName](btn);
                    if (s) s.playBtnEffect(btn.__soundName, name);
                }
                else
                {
                    cc.log(target._goName, "no function " + callbackName);
                }
            }
        }, target);
    },

    OnClicked: function(btn, target, name)
    {
        if (name == null)
        {
            name = btn.getName();
        }
        btn.addTouchEventListener(function(sender, type) {
            if (type == ccui.Widget.TOUCH_ENDED)
            {
                var callbackName = "click_" + name;
                var s = target.find ? target.find("SCSound") : null;
                if (target[callbackName])
                {
                    target[callbackName](btn);
                    if (s) s.playBtnEffect(btn.__soundName, name);
                }
                else
                {
                    cc.log(target._goName, "no function " + callbackName);
                }
            }
        }, target);
    },

    CallAfter: function(node, interval, name, args)
    {
        var callback = function()
        {
            if (typeof name == "function")
            {
                name(args);
                return;
            }
            if (node[name]) { node[name](args);}
        }
        var c1 = cc.delayTime(interval);
        var c2 = cc.callFunc(callback);
        var act = new cc.Sequence(c1, c2);
        node.runAction(act);
    },
    
    // 循环调用
    CallLoop: function(node, interval, tag, func)
    {
        var callback = function()
        {
            func();
        }
        var c1 = cc.delayTime(interval);
        var c2 = cc.callFunc(callback);
        var act = cc.repeatForever(cc.sequence(c1, c2));
        act.setTag(tag);
        node.runAction(act);
    },

    // 打印结点
    log: function(node)
    {
        cc.each(node, function(val, i){   
            cc.log(i, "=", val);
        });   
    },

    warn: function(str)
    {
        cc.log("++++++++++++++++++++++++++++++");
        cc.log(str);
        cc.log("++++++++++++++++++++++++++++++");
    },

    CreateAnimation: function(strFormat, inteval)
    {
        var animation = new cc.Animation();
        var i = 0;
        while (true)
        {
            var frameName = strFormat + "_" + ((i < 10) ? ("0" + i) : i) + ".png";
            var spriteFrame = cc.spriteFrameCache.getSpriteFrame(frameName)
            if (spriteFrame == null) break;
            animation.addSpriteFrame(spriteFrame);
            i = i + 1;
        }
        animation.setDelayPerUnit(inteval);
        return animation;
    },

    Atan2: function(y, x)
    {
        return Math.atan2(y, x) * this.rpd;
    },

    // 角度转弧度
    DegreeToRadian: function(degree)
    {
        return degree * this.dpr;
    },

    BindTimelineAction: function(target)
    {
        var action = target.getActionManager().getActionByTag(target.getTag(), target);
        target.action = action;
    },

    PlayTimelineAction: function(target, tag, loop)
    {
        loop = loop == null ? true : loop;
        var action = target.getActionManager().getActionByTag(target.getTag(), target);
        if (action)
        {
            target.action = action;
            if (tag)
            {
                action.play(tag, loop);
            }
            else
            {
                action.gotoFrameAndPlay(0, loop);
            }
        }
    },

    Invoke: function(target, funcName)
    {
        var func = target[funcName];
        if (!func)
        {
            return;
        }
        // 在参数首位固定添加调用对象
        [].splice.call(arguments, 0, 2, target);
        return Function.call.apply(func.bind(target), arguments);
    },

    // 浅拷贝对象
    Copy: function(obj)
    {
        var newobj = {};
        for ( var attr in obj) 
        {
            newobj[attr] = obj[attr];
        }
        return newobj;
    },

    // 数组中是否存在值
    HasValueAndRemove: function(list, val)
    {
        for (var i = list.length - 1; i > -1; i--)
        {
            if (list[i] == val)
            {
                list.splice(i, 1);
                return true;
            }
        }
        return false;
    },
    
    DownloadPic: function(url, callfunc) {
        var ext = cc.path.extname(url);
        if (ext == ".jpg" || ext == ".png")
        {
            cc.loader.load([url], function(err, img) {
                if (err) return;
                callfunc(url);
            });
            return;
        }
        cc.loader.loadImg([url], function(err, img) {
            if (err) return;
            cc.textureCache.handleLoadedTexture(url, img);
            callfunc(url);
        });
    },

    // 随机low-high 区间的整数
    Range: function(low, high)
    {
        var max = Math.max(low, high);
        var min = Math.min(low, high);
        var r = Math.floor(Math.random() * 100000);
        return r % (max - min + 1) + min;
    },

    GetVersion: function() {
        return "1.0.1"
    },

    //TextField To EditBox
    TextFieldToEditBox: function(textField) {
        var parent = textField.getParent()
        var size = textField.getContentSize()
        var anchor = textField.getAnchorPoint()
        var pos = textField.getPosition()
        var placeHolder = textField.getPlaceHolder()
        var placeHolderColor = cc.c3b(255, 255, 255)
        var textColor = textField._realColor
        var fontSize = textField.getFontSize()
        var fontName = textField.getFontName()
        var content = textField.getString()
        var isPwd = textField.isPasswordEnabled()
        var maxLen = textField.getMaxLength()
        var edit = EditBox.create(size)
        .addToEx(parent)
        .move(pos)
        .setPlaceHolder(placeHolder)
        .setPlaceholderFontSize(fontSize)
        .setFontSize(fontSize)
        .setInputMode(cc.EDITBOX_INPUT_MODE_ANY)
        .setInputFlag(isPwd ? EDITBOX_INPUT_FLAG_PASSWORD : cc.EDITBOX_INPUT_FLAG_INITIAL_CAPS_ALL_CHARACTERS)
        .setString(content)
        .setMaxLength(maxLen==0?999:maxLen)
        //.setAnchorPoint(anchor)
        parent.removeChild(textField)
        edit.setAnchorPoint(anchor)
        return edit
    },

    clock: function() {
        return Date.now();
    },

    //-----------------------------------------------------
    // 分割字符
    //-----------------------------------------------------

    // 默认用(,)分割
    SplitArray: function(str) {
        return str.split(/,|;/);
    },

    // 分割位置，返回用
    SplitPosList: function(str) {
        return str.split(/,|;/);
    },


    // 计算工程文件要使用的资源
    CalcStudioAssets: function(ccsFile)
    {
        //cc.log(ccsFile);
        var b = cc.loader.getRes(ccsFile);
        var dir = cc.path.dirname(ccsFile);
        var arr = dir.split("/");
        arr.pop();
        var d1 = arr.join("/");
        arr.pop();
        var d2 = arr.join("/");
        var resList = [];
        var per = this.PreUrl;
        b.Content.Content.UsedResources.map(function(path) {
            var ext = cc.path.extname(path);
            if (ext != ".json") {
                var f;
                if (".." === path.substr(3, 2)) {
                    f = path.replace("../..", d2);
                } else if(".." == path.substr(0, 2)) {
                    f = path.replace("..", d1);
                } else {
                    f = dir + "/" + path;
                }
                if (!cc.loader.cache[per + f]) {
                    resList.push(f);
                }
            }
        });
        return resList;
    },

    GC: function()
    {
        if (wls.IsMiniProgrom() && wx.triggerGC)
        {
            wx.triggerGC();
        }
    }
};

wls.init();
wls.namespace = {}; // 类名空间

// 场景基类
wls.GameScene = cc.Node.extend
({
    ctor: function () 
    {
        this._super();
        this.init();
    },

    init: function()
    {
        this.mGCTimer = 0;
        this.mbSleep = false; // 场景是否休眠
        this.mAssetsPath = "";
        this.mGameObjects = {};
        this.mTimerObjects = [];
        this.mTimerList = [];
        this.mPushViewList = [];
        this.mPicCache = [];
        this.mRoot = this;
        this.scheduleUpdate();
        this.initResolution();
        this.onCreate();
        NotificationCenter.addNotification(this, Event.ON_PAY_RESULT);
    },

    onCreate: function()
    {

    },

    isSleep: function()
    {
        return this.mbSleep;
    },

    setSleep: function(b)
    {
        this.mbSleep = b
    },

    event_on_pay_result: function(result)
    {
        if (this.isSleep()) return;
        cc.log(result);
        this.onPayResult(result.status == 0);
    },

    // 支付结果
    onPayResult: function(bSuccess)
    {
        
    },

    destroy: function()
    {
        cc.log("destroy")
        NotificationCenter.removeNotificationByName(this, Event.ON_PAY_RESULT);
        this.unscheduleUpdate();
        this.post("cleanup");
        this.removePicCache();
        this.mGameObjects = null;
        this.mTimerObjects = null;
        this.mTimerList = null;
        this.mPushViewList = null;
        this.mRoot = this;
    },

    // 移除图像缓存
    removePicCache: function()
    {
        for (var i = 0; i < this.mPicCache.length; i++)
        {
            cc.textureCache.removeTextureForKey(this.mPicCache[i]);
        }
        this.mPicCache.length = 0;
    },

    // 初始分辨率
    initResolution: function()
    {
        isIOS()&&(wls.wechatRightSize.width = 170)
        if (display.width == 1280)
        {
            wls.MainScale = display.height / 720;
            wls.ScaleX = 1;
            wls.ScaleY = wls.MainScale;
            wls.OffsetX = 0;
            wls.OffsetY = 0;
        }
        else
        {
            wls.MainScale = display.width / 1280;
            wls.ScaleX = wls.MainScale;
            wls.ScaleY = 1;
            if (!Device.isCutoutDisplay())
            {
                wls.OffsetX = 0;
                wls.OffsetY = 0;
            }
            else
            {
                wls.OffsetX = display.width * 0.05; // ios才用流海
                wls.OffsetY = isIOS() ? 20 : 0;
            }
        }
        wls.FishPathSX = display.width / 1280
        wls.FishPathSY = display.height / 720
        wls.MainScale = wls.ScaleY > wls.ScaleX ? wls.ScaleY : wls.ScaleX;
        wls.MinScale = wls.ScaleY > wls.ScaleX ? wls.ScaleX : wls.ScaleY;
        cc.log(wls.MainScale, wls.ScaleX, wls.ScaleY);
    },

    update: function(dt)
    {
        if (dt > 1.0) dt = 1.0;
        // 30秒GC一次
        this.mGCTimer += dt;
        if (this.mGCTimer > 240)
        {
            wls.GC();
            this.mGCTimer = 0;
        }
        this.updateAllTimer(dt);
    },

    // 设置对象的父结点
    setGameObjectRoot: function(root)
    {
        this.mRoot = root || this;
    },

    loadStudioAssets: function(filename, cf) {
        var f = wls.PreUrl + this.mAssetsPath + filename;
        if (cc.loader.cache[f]) {
            cf();
            return
        }
        var errorHandler = function(r) {
            if (wls.bLoadAssestError) return;
            wls.bLoadAssestError = true;
            cc.log(r);
        }
        // 加载工程文件
        cc.loader.load([f], function(err) {
            if (err) errorHandler(f);
            var list = wls.CalcStudioAssets(f);
            if (list.length == 0) {
                cf();
                return
            }
            //cc.log(list)
            cc.loader.load(list, function(err) {
                if (err) errorHandler(list);
                for (var a = 0, b = list.length; a < b; a++) {
                    var c = list[a];
                    -1 != c.indexOf("plist") && cc.spriteFrameCache.addSpriteFrames(c);
                }
                cf();
            }, this)
        }, this)
    },

    doCreateObject: function(go, args, bActive)
    {
        // app不用动态加载
        if (FishApp) {
            go.onCreate(args);
            bActive && wls.Invoke(go, "onActive", args);
            return;
        }
        // 不是ui对象
        if (!go._ccsFile && !go._refFiles) {
            go.onCreate(args);
            bActive && wls.Invoke(go, "onActive", args);
            return;
        }
        this.loadGameObjectAssest(go, "onCreate", args, bActive);
    },

    modifyLoadCnt: function(cnt)
    {
        if (!wls.EnableLoading)
        {
            wls._LoadCnt = 0;
            return;
        }
        wls._LoadCnt += cnt;
        var scene = Director.getRunningScene()
        var layer = scene.getChildByTag(200000)
        if (!layer)
        {
            layer = LoadingLayer.create()
            layer.addToEx(scene, 0, 200000)
            layer.setTips("Loading...")
        }
        layer.setVisible(wls._LoadCnt > 0);
    },

    loadGameObjectAssest: function(go, funcname, args, bActive)
    {
        wls.LoadStudioCnt++;
        var list = [];
        // 添加引用的资源
        if (go._refFiles) {
            for (var i = 0; i < go._refFiles.length; i++) {
                list.push(go._refFiles[i]);
            }
        }
        go._ccsFile && list.push(go._ccsFile)
        this.modifyLoadCnt(1);
        this.loadStudioAssetList(list, function() {
            if (typeof funcname == "string") {
                wls.Invoke(go, funcname, args);
            } else {
                funcname(args);
            }
            bActive && wls.Invoke(go, "onActive", args);
            wls.LoadStudioCnt--;
            this.modifyLoadCnt(-1);
        }.bind(this)); 
    },

    // 下载列表
    loadStudioAssetList: function(list, cf) 
    {
        var idx = 1;
        var total = list.length;
        var func = function(file, bEnd) {
            this.loadStudioAssets(file, function() {
                if (bEnd) {
                    if (cf) cf();
                } else {
                    var f = list[idx];
                    idx++;
                    return func(f, idx >= total);
                }
            })
        }.bind(this); 
        func(list[0], idx >= total);
    },

    // 创建对象(支持不定长参数)
    createGameObject: function(clsName, args, bActive)
    {
        //cc.log("创建对象 " + clsName);
        var cls = wls.namespace[clsName];
        var go = new cls();
        go._goName = clsName;
        go._Scene = this;
        this.mRoot.addChild(go,go.getZorder ?go.getZorder():0);
        this.mGameObjects[clsName] = go;
        this.extendGameObject(go);
        this.doCreateObject(go, args, bActive);
        return go;
    },

    // 创建自己命名的对象
    createNamedObject: function(clsName, name, args)
    {
        var go = this.createGameObject(clsName, args);
        delete this.mGameObjects[clsName];
        this.mGameObjects[name] = go;
        go._goName = name;
        return go;
    },

    // 无名对象
    createUnnamedObject: function(clsName, args)
    {
        //cc.log("创建无名对象 " + clsName);
        var cls = wls.namespace[clsName];
        var go = new cls();
        go._goName = clsName;
        go._Scene = this;
        this.mRoot.addChild(go);
        this.extendGameObject(go);
        this.doCreateObject(go, args);
        return go;
    },

    // 创建无名结点(不主动加到场景结点)
    createUnnamedNode: function(clsName, args)
    {
        //cc.log("创建无名结点 " + clsName);
        var cls = wls.namespace[clsName];
        var go = new cls();
        go._goName = clsName;
        go._Scene = this;
        this.extendGameObject(go);
        this.doCreateObject(go, args);
        return go;
    },

    // 给结点扩展类
    wrapGameObject: function(node, clsName, args)
    {
        //cc.log("包装对象 " + clsName);
        var cls = wls.namespace[clsName];
        var go = node;
        go._goName = clsName;
        go._Scene = this;
        this.mGameObjects[clsName] = go;
        this.extendGameObject(go);
        var o = Object.getOwnPropertyNames(cls.prototype);
        for (var i in o)
        {
            var name = o[i];
            if (name != "constructor" && name != "__pid")
            {
                go[name] = cls.prototype[name];
            }
        };
        go.onCreate(args);
        return go;
    },

    // 弹出窗口
    pushView: function(name, args)
    {
        var go = this.activeGameObject(name, args);
        this.mPushViewList.push(go);
        return go 
    },

    // 激活对象（显示）
    activeGameObject: function(name, args)
    {
        var go = this.mGameObjects[name];
        if (go == null)
        {
            go = this.createGameObject(name, args, true);
        }
        else
        {
            go.setVisible(true);
            wls.Invoke(go, "onActive", args);
        }
        return go;
    },

    // 从列表中移除对象
    removeObjectFromList: function(list, go)
    {
        for (var i = list.length - 1; i > -1; i--)
        {
            if (list[i] == go)
            {
                list.splice(i, 1);
                break;
            }
        }
    },

    // 通过名字，移除对象
    removeGameObject: function(goName)
    {
        var go = this.find(goName);
        if (go == null) return;
        //cc.log("+++++++++++++移除对象", goName);
        delete this.mGameObjects[goName];
        this.removeObjectFromList(this.mTimerObjects, go);
        go.removeFromParent(true);

        var l = this.mPushViewList.length;
        while (l > 0)
        {
            l = l - 1;
            var ui = this.mPushViewList[l];
            if (goName == ui._goName) {
                this.mPushViewList.splice(l, 1);
                break
            }
        }

    },

    // 查找对象
    find: function(goName)
    {
        return this.mGameObjects[goName];
    },

    // 开启定时器
    startTimer: function(target, funcName, interval, id, repeat)
    {
        if (!target._bTimerObject)
        {
            target._bTimerObject = true;
            this.mTimerObjects.push(target);
        }
        var timer = {};
        timer.target = target;
        timer.id = id;
        timer.cur = 0;
        timer.interval = interval;
        timer.cnt = 0;
        timer.repeat = repeat;
        timer.alive = true;
        timer.func = function(){ target[funcName](); }
        timer.funcName = funcName;
        target.mTimerList.push(timer);
    },

    stopTimer: function(target, id)
    {
        var list = target.mTimerList;
        for (var i = list.length - 1; i >= 0; i--)
        {
            var timer = list[i];
            if (id == timer.id)
            {
                timer.alive = false;
                break;
            }
        }
    },

    resetTimer: function(target, id, interval)
    {
        var list = target.mTimerList;
        for (var i = list.length - 1; i >= 0; i--)
        {
            var timer = list[i];
            if (id == timer.id)
            {
                timer.interval = interval || timer.interval;
                timer.cur = 0;
                break;
            }
        }
    },

    // 更新所有计时器
    updateAllTimer: function(dt)
    {
        this.updateObjectTimer(this, dt);
        var i = 0;
        var l = this.mTimerObjects.length;
        for (i = 0; i < l; i++)
        {
            this.updateObjectTimer(this.mTimerObjects[i], dt);  
        }
    },

    updateObjectTimer: function(obj, dt)
    {
        if (obj && obj.mTimerList.length > 0)
        {
            var list = obj.mTimerList;
            for (var i = list.length - 1; i >= 0; i--)
            {
                var timer = list[i];
                if (timer.alive)
                {
                    timer.cur += dt;
                    if (timer.cur >= timer.interval)
                    {
                        timer.cur -= timer.interval;
                        timer.cnt++;
                        if (timer.repeat > 0 && timer.cnt >= timer.repeat)
                        {
                            timer.alive = false;
                        }
                        //var t1 = wls.clock();
                        timer.func();
                        //cc.log(timer.funcName, wls.clock() - t1);
                    }
                }
                else
                {
                    list.splice(i, 1);
                }
            }
        }
    },

    post: function(eventName, args)
    {
        //cc.log("抛送事件", eventName);
        for (var key in this.mGameObjects)
        {
            var obj = this.mGameObjects[key];
            if (obj && obj[eventName])
            {
                obj[eventName](args);
            }
        }
    },

    dialog: function(modeType, strmsg, callback, strhook)
    {
        var go = this.find("UIDialog");
        if (go == null) return;
        go.updateView(modeType, strmsg, strhook);
        go.setCallback(callback);
    },

    toast: function(str)
    {
        var go = this.find("UIToast");
        if (go == null) return;
        go.showText(str);
    },

    waiting: function(isShow,keyName,waitStr,callBack)
    {
        var go = this.find("UIWaiting");
        if (go == null) return;
        go.updateKey(isShow,keyName,waitStr,callBack)
    },

    rename: function(go, name)
    {
        delete this.mGameObjects[go._goName];
        go._goName = name
        this.mGameObjects[name] = go;
    },

    // 监听返回键
    listenKeyBackEvent: function()
    {
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed:  function(keyCode, event)
            {
                if (keyCode == 27) //按键T
                {
                    this.onKeyBack();
                }
            }.bind(this),
        }, this);
    },

    // 返回键
    onKeyBack: function() 
    {
        if (wls.IsMiniProgrom()) return;
        var go = this.find("UIGreenHand")
        if (go && go.runGreen != null) {
            return 
        }
        if (this.find("UIDialog") && this.find("UIDialog").isVisible())
        {
            return;
        }
        var l = this.mPushViewList.length;
        while (l > 0)
        {
            l = l - 1;
            var ui = this.mPushViewList[l];
            this.mPushViewList.splice(l, 1);
            if (ui && ui.getParent() && ui.isVisible() && ui.doKeyBack())
            {
                return;
            }
        }
        this.doExit();
    },

    // 显示支付
    showPay: function(tb)
    {

    },

    doCancelPay: function() {},

    doExit: function()
    {

    },
    waitOverTime: function() {},

    sendMsg: function()
    {
        
    },

    // 扩展对象的方法
    extendGameObject: function(go)
    {
        var target = this;
        go.nextStateName = "";
        go.mTimerList = [];
        go._bTimerObject = false;

        go.loadCCSNode = function(bindTo)
        {
            if (!this._ccsFile) return;
            bindTo = bindTo || this;
            return wls.LoadStudioNode(this.fullPath(this._ccsFile), bindTo);
        }

        go.loadCCSLayout = function(bindTo)
        {
            if (!this._ccsFile) return;
            bindTo = bindTo || this;
            return wls.LoadStudioLayout(this.fullPath(this._ccsFile), bindTo);
        }

        // 返回键
        go.doKeyBack = function()
        {
            if (go.click_btn_close) {
                go.click_btn_close()
            } else {
                go.setVisible(false);
            }
            return true;
        }

        go.pushView = function(name, args)
        {
            return target.pushView(name, args);
        }

        go.setNextStateName = function(name)
        {
            this.nextStateName = name;
        }

        go.gotoNextState = function()
        {
            cc.log("+++++++++++++++++++gotoNextState", this.nextStateName);
            var name = this.nextStateName;
            this.nextStateName = null;
            wls.Invoke(target, name);
        }
        // 查找对象
        go.find = function(goName)
        {
            return target.find(goName);
        }

        // 移除对象
        go.removeFromScene = function(goName)
        {
            if (goName == null) { goName = go._goName;}
            return target.removeGameObject(goName);
        }

        go.removeGameObject = function(goName)
        {
            return target.removeGameObject(goName);
        }

        // 获得场景
        go.getScene = function()
        {
            return target;
        }

        go.createGameObject = function(clsName, args)
        {
            return target.createGameObject(clsName, args);
        }

        go.createUnnamedObject = function(clsName, args)
        {
            return target.createUnnamedObject(clsName, args);
        }

        go.createUnnamedNode = function(clsName, args)
        {
            return target.createUnnamedNode(clsName, args);
        }

        go.wrapGameObject = function(node, clsName, args)
        {
            return target.wrapGameObject(node, clsName, args);
        }

        go.activeGameObject = function(name, args)
        {
            return target.activeGameObject(name, args);
        }

        // 资源的全路径
        go.fullPath = function(filename)
        {
            return target.mAssetsPath + filename
        }

        // 开启定时器
        go.startTimer = function(funcName, interval, id, repeat)
        {
            return target.startTimer(go, funcName, interval, id, repeat);
        }

        go.stopTimer = function(id)
        {
            return target.stopTimer(go, id);
        }

        go.resetTimer = function(id, interval)
        {
            target.resetTimer(go, id, interval);
        }

        // 抛送事件
        go.post = function(eventName, args)
        {
            return target.post(eventName, args);
        }

        go.dialog = function(modeType, strmsg, strhook)
        {
            return target.dialog(modeType, strmsg, strhook);
        }

        go.toast = function(str){ return target.toast(str); }
        go.waiting = function(isShow,keyName,waitStr,callBack){ return target.waiting(isShow,keyName,waitStr,callBack);}
        go.rename = function(name){ return target.rename(go, name);}
        go.showPay = function(tb, cancelFunc){ return target.showPay(tb, cancelFunc) }
        go.sendMsg = function() 
        { 
            target.sendMsg.apply(target, arguments); 
        }

        go.adaptClose = function(obj) { target.adaptClose(obj) }

        // 下载图片
        go.downloadPic = function(url, cf, bRemove)
        {
            wls.DownloadPic(url, function(filePath) {
                if (!cc.sys.isObjectValid(this)) return;
                if (bRemove)
                {
                    target.mPicCache.push(filePath);
                }
                if (cf) cf(filePath);
            }.bind(this));
        }
    },
});


// 包装结点类
wls.WrapNode = cc.Class.extend
({

});


