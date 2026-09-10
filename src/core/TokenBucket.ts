export interface ConsumeResult{
    allowed: Boolean;
    remaining: number;
    retryAfterms: number;
}


export class TokenBucket{
    private tokens : number;
    private lastRefill : number;

    constructor(private readonly capacity: number, private readonly refillRate:number, now:number = Date.now()){
        this.tokens = capacity;
        this.lastRefill = now;
    }

    private refill(now:number):void{
        const SecondsPassed = Math.max(0,(now-this.lastRefill)/1000); //either no time passed or something got passed.
        this.tokens = Math.min(this.capacity, this.tokens + SecondsPassed*this.refillRate);
        this.lastRefill = now;
    }   

    tryToConsume(now:number = Date.now()): ConsumeResult{
        this.refill(now);

        // if we pass the check
        if(this.tokens>=1){
            this.tokens -= 1;
            return {allowed:true, remaining:this.tokens, retryAfterms:0};
        }

        const retryAfterms = this.refillRate > 0 ? Math.ceil(((1-this.tokens)/this.refillRate)*1000) : Infinity; // time to get atleast 1 token back!

         return {allowed:false, remaining:this.tokens, retryAfterms};

    }
}

