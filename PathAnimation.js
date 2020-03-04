class PathAnimation {
    constructor(options){
        options = options || {};
        this.options_=options;
        this.speed_ = options.speed || 0;
        this.path_ = options.path;
        let easing = typeof(options.easing) == 'function' ? options.easing : this.linear;
        if (options.revers) this.easing_ = function(t) { return (1 - easing(t)); };
        else this.easing_ = easing;
        this.duration_ = typeof(options.duration) == 'number' ? (options.duration >= 0 ? options.duration : 0) : 1000;
        this.repeat_ = Number(options.repeat)||0;
        this.dispatchEvent_=options.callback;
        this.index=0;
        this.angle=0;
        this.coordinates=[];
        switch (options.rotate) {
            case true:
            case 0:
                this.rotate_ = 0;
                break;
            default:
                this.rotate_ = options.rotate || false;
                break;
        }
        if(this.path_&&this.path_.length){
            this.dist_ = turf.length(turf.lineString(this.path_), {units:options.units||'kilometers'})*1000;
            if (this.speed_ > 0) this.duration_ =this.dist_  / this.speed_;
            //this.init();
        }else{
            this.dist_=0;
            console.log("please ensure the path's length");
        }
    }

    start(){
       this.init_();
       this.animate();
    }

    stop(){
        this.dispatchAnimationend();
        this.init_();
    }

    init_(){
        this.animateTimer&&cancelAnimationFrame(this.animateTimer)&&(this.animateTimer=null);
        this.index = 0;
        this.repeat=0;
        this.startTime=0;
        this.animateTime = 0;
        this.elapsed = 0;
        this.angle=0;
    }


    animate(){
        if (!this.dist_) return ;
        if(this.startTime==0){
            this.startTime=performance.now();
            this.animateTime =0;
        }else {
            this.animateTime = performance.now() - this.startTime;
        }
        this.elapsed = this.animateTime /this.duration_;
        //if (this.elapsed > 1) this.elapsed = 1;
        let dmax = this.dist_ * this.easing_(this.elapsed);
        let p0, p, dx, dy, dl, d = 0;
        p =turf.toMercator(turf.point(this.path_[0])).geometry.coordinates;
        for (let i = 1; i < this.path_.length; i++) {
            p0 = p;
            p = turf.toMercator(turf.point(this.path_[i])).geometry.coordinates;
            dx = p[0] - p0[0];
            dy = p[1] - p0[1];
            dl = Math.sqrt(dx * dx + dy * dy);
            if (dl && d + dl >= dmax) {
                let s = (dmax - d) / dl;
                p = [p0[0] + (p[0] - p0[0]) * s, p0[1] + (p[1] - p0[1]) * s];
                this.index = i;
                break;
            }
            d += dl;
        }

        this.coordinates=p= turf.toWgs84(turf.point(p)).geometry.coordinates;
        if (this.rotate_ !== false) {
            //this.angle = this.angle- Math.atan2(p0[1] - p[1], p0[0] - p[0]);
            this.angle=turf.bearing(
                turf.toWgs84(turf.point(p0)),
                turf.point(p)


            );
        }

        if(d>this.dist_){
            if(this.repeat_==-1){
                this.dispatchAnimating_();
                this.startTime=0;
            }else{
                this.repeat++;
                if(this.repeat<this.repeat_){
                   this.dispatchAnimating_();
                    this.startTime=0;
                }else{
                    this.stop();
                    return;
                }
            }

        }else{
            this.dispatchAnimating_();
        }

        this.animateTimer=requestAnimationFrame(this.animate.bind(this));
    }

    dispatchAnimating_(){
        const evt={type:'animating', coordinates: this.coordinates, index: this.index ,angle:this.angle  };
        this.dispatchEvent_(evt)
    }

    dispatchAnimationend(){
        const evt={type:'animationend',coordinates: this.coordinates, index: this.index ,angle:this.angle };
        this.dispatchEvent_(evt)
    }

    linear(t) {
        return t;
    }
}