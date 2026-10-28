export namespace main {
	
	export class Generated {
	    password: string;
	    entropy: number;
	
	    static createFrom(source: any = {}) {
	        return new Generated(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.password = source["password"];
	        this.entropy = source["entropy"];
	    }
	}

}

