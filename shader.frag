out vec4 fragCol;

vec3 erot(vec3 p, vec3 ax, float ro) {
	return mix(dot(p,ax)*ax,p,cos(ro))+sin(ro)*cross(ax,p);
}

float smin(float a, float b, float k) {
	float h = max(0.,k-abs(b-a))/k;
	return min(a,b)-h*h*h*k/6.;
}

float ss(vec2 p) { return sqrt(length(p*p));}
float ss(vec3 p) { return sqrt(length(p*p));}
float box(vec2 p, vec2 d) {
	vec2 q = sqrt(p*p+0.005)-d;
	return ss(max(q,0.))+min(0.,max(q.x,q.y));
}

float linedist(vec2 p, vec2 a, vec2 b) {
	float k = dot(p-a,b-a)/dot(b-a,b-a);
	return distance(p,mix(a,b,clamp(k,0.,1.)));
}

float pin_sdf(vec2 p) {
	p+=sin(p.y*15.)*sin(p.x*15.)*.002;
	float inner = length(p)-.73;
	float angl = atan(p.y,p.x);
	float angl2 = asin(sin(angl*5.-1.4)*.995)/5.;
	angl = asin(sin(angl*1.3)*.99)/1.3;
	vec2 p2 = vec2(cos(angl),sin(angl))*length(p);
	vec2 p3 = vec2(cos(angl2),sin(angl2))*length(p);
	float pentagram = linedist(p3, vec2(0.67,0.22),vec2(0.25,-0.07));
	pentagram = smin(pentagram, linedist(p3, vec2(0.23,-0.07),vec2(0,0.60)) ,.05 );
	float arms = box(p2-vec2(1.4,0), vec2(.6,.1));

	mat2 rot = mat2(.7,-.7,.7,.7);
	float cplane1 = p.x;
	float cplane2 = p.y*.95-p.x*.32-.1;

	float bars = min(box(p2-vec2(1.45,0), vec2(.1,.35)), box((abs(p2)-vec2(1.45,.35))*rot, vec2(.13)));
	arms = smin(arms, max(cplane2,bars),.05);

	float arrow = box((p2-vec2(1.9,0))*vec2(.6,1)*rot, vec2(.2,.2));
	arrow = -smin(-arrow, p2.x-1.9, .03);
	arms = smin(arms, max(cplane1,arrow),.05);

	//bar on bottom of bottom leg
	arms = smin(arms, box((p2-vec2(1.95,0))*rot, vec2(.12,.12)),.05);

	float body = smin(arms-.05,min(max(length(p)-1.,-inner),inner),.1);
	body = -smin(-body,pentagram,0.05);
	return body;
}

float hash(float a, float b) {
	int x = floatBitsToInt(a*a/7.)^floatBitsToInt(a+.1);
	int y = floatBitsToInt(b*b/7.)^floatBitsToInt(b+.1);
	return float((x*x+y)*(y*y-x)-x)/2.14e9;
}

vec2 hash2(float a, float b) {
	float s1 = hash(a,b);
	float s2 = hash(s1,a);
	return vec2(s1,s2);
}

float pin_edge;
float fabric;
float scene(vec3 p) {
	vec3 p2 = erot(p,vec3(1,0,0),2.7),p3 = p;
	p.y=p.y/1.5+1.2;
	p.yz = asin(sin(p.yz/20.)*.6)*20.;
	//weird space folding for the fabric texture.
	mat2 rot = mat2(cos(2.6),-sin(2.6),sin(2.6),cos(2.6)); //erot is powerful, but slower here
	for(int i = 0; i < 8; i++) {
		p.yz-=float(i);
		p.yz*=rot;
		p.y = sqrt(p.y*p.y+float(i/2+1))-.5;
	}

	vec3 edg = normalize(vec3(-1,1.,1.));
	p2.yz += asin(sin(p.yz)*.9);
	p2.yz=asin(sin(p2.yz*vec2(5.,8.))*.85)/vec2(5.,8.);
	fabric = dot(p,edg);

	p2.x=fabric/1.;
	p2+=.005*dot(sin(p3.yz*8.4),cos(p3.xy*6.));
	p2+=.001*dot(sin(p3.yz*50.),cos(p3.xy*40.));

	fabric = smin(fabric,(mix(length(p2),ss(p2),.7)-0.2),.2);

	p3.x-=6.;
	p3=erot(p3,vec3(.997,0,-.075),2.45);
	float pinsdf = pin_sdf(p3.yz/13.)*13.;
	p3 += p2/30.;
	p3 += sin(p.yxz*10.)/1000.;
	float ln = dot(p3.yz,p3.yz)/14.;
	float bump = smoothstep(1.1,1.5,sin(p.y*60.+sin(p.y*4.6)*1.35)+sin(p.z*50.+sin(p.z*5.6)*1.5));
	bump += smoothstep(1.1,1.3,sin(p.y*90.+sin(p.y*5.6)*1.45)+sin(p.z*80.+sin(p.z*7.6)*1.55));
	float pin_inside = box(vec2(pinsdf+2., p3.x-sqrt(sqrt(smoothstep(0.,-1.7,pinsdf)))*.1), vec2(2.,.85-ln*.005))-.2;

	pin_edge = box(vec2(pinsdf, p3.x), vec2(.12+cos(p3.y/20.)*0.05-ln*.001,1.-ln*.005))-.12+bump/1500.;
	pin_edge = mix(pin_edge, linedist(vec2(pinsdf, p3.x), vec2(0.5,1),vec2(0,-1))-.3,0.005);
	return min(fabric,min(pin_edge,pin_inside));
}

vec3 norm(vec3 p) {
	mat3 k = mat3(p,p,p)-mat3(0.001);
	return normalize(scene(p)-vec3(scene(k[0]),scene(k[1]),scene(k[2])));
}

const vec3 suncol = vec3(1.5,1.0,0.7);
const vec3 skycol = vec3(0.4,0.75,1.0);
const vec3 sundir = normalize(vec3(-1,0.,1.2));
vec3 skybox(vec3 angle) {
	return mix(vec3(1),skycol, angle.x*angle.x) 
		+ pow(max(dot(angle, sundir),0.0),350.0)*suncol*15.0;
}

vec3 pixel_color( vec2 uv )
{
	uv.y-=.02;uv.x+=.02;
	vec2 h2 = hash2(uv.x,uv.y);
	vec3 cam = normalize(vec3(2.5,uv+h2*.02));
	vec3 init = vec3(-120,-h2);
	float yrot = -.6;
	cam = erot(cam,vec3(0,1,0),yrot);
	init = erot(init,vec3(0,1,0),yrot);
	vec3 p = init;
	bool hit = false;
	float atten = 1.;
	float dist;
	for (int i = 0; i < 200 && !hit; i++) {
		dist = scene(p);
		hit = dist*dist < 1e-7;
		if (hit && dist == pin_edge) {
			vec3 n = norm(p);
			atten *= 1.-abs(dot(cam,n))*.5;
			cam = reflect(cam,n);
			dist = .1;
			hit = false;
		}
		p += cam * dist;
		if (distance(p,init) > 1000.)break;
	}
	float mat = dist == fabric ? 1. : 0.;
	vec3 n = norm(p);
	vec3 r = reflect(cam,n);
	float spec = max(0.,dot(r,sundir));
	float fres = 1.-abs(dot(cam,n))*.9;
	float ao = smoothstep(-1.,2.,scene(p+n*.5+sundir*3.));
	vec3 col = (spec*.3*skycol*(ao*.2+.7) +
		((pow(spec,8.)*.1*suncol+ pow(spec,20.))*4.)*mat+
		(mat*.8+.2)*(pow(spec,80.)*3.+ step(0.999-mat*.01,spec)*10.))*fres*ao;
	return (hit ? col : skybox(cam))*atten;
}

//blessed be mattz for posting the code to fit garbor functions to arbitrary images!
//from https://www.shadertoy.com/view/4ljSRR
//this is used to hardcode the bloom >:3
float gabor(vec2 p, float u, float v, float r, float ph, float l, float t, float s, float h) {
	float cr = cos(r);
	float sr = sin(r);
	vec2 st = vec2(s,t);
	p = mat2(cr, -sr, sr, cr) * vec2(p.x-u,-p.y-v);
	return h * exp(dot(vec2(-0.5), p*p/(st*st))) * cos(p.x*6.28/l+ph);
}

void main() {
	fragCol = vec4(0);
	vec2 uv = (gl_FragCoord.xy-vec2(960,540))/1080;
	float sd = hash(uv.x,uv.y);
	for (int i = 0; i < SAMPLES; i++) {
		vec2 h2 = hash2(sd, float(i));
		vec2 uv2 = uv + h2/1080;
		fragCol += vec4(pixel_color(uv2), 1);
	}

	float k = 0.0;

	k+=gabor(uv, 0.07, 0.03, 1.89, 1.08, 3.65, 0.13, 0.12, 1.82);
	k+=gabor(uv, -0.52, 0.94, 3.26, 2.84, 3.72, 0.53, 0.53, 0.21);
	k+=gabor(uv, 0.05, -0.16, 1.60, 1.52, 3.12, 0.09, 0.09, 1.50);
	k+=gabor(uv, 0.45, 0.94, 6.28, 2.33, 4.00, 0.48, 0.48, 0.17);
	k+=gabor(uv, 0.30, 0.03, 4.39, 6.27, 0.36, 0.13, 0.13, 0.11);
	k+=gabor(uv, 0.07, -0.08, 3.17, 1.22, 0.41, 0.16, 0.05, 0.15);
	k+=gabor(uv, 0.94, -0.55, 4.75, 4.04, 1.14, 1.06, 0.14, 0.18);
	k+=gabor(uv, -0.88, -0.18, 4.03, 3.94, 1.29, 0.49, 0.49, 0.05);
	k+=gabor(uv, 0.16, -0.05, 1.60, 6.28, 0.21, 0.05, 0.05, 0.18);
	k+=gabor(uv, -0.42, 0.45, 5.45, 1.03, 0.76, 0.35, 0.35, 0.05);

	fragCol/=fragCol.w;
	float bloom = k*.9+.2;
	vec4 bbright = vec4(0xaf,0x84,0x6a,0)/128.;
	vec4 bmid = vec4(0x15,0x17,0x19,0)/60.;
	fragCol = mix(fragCol,mix(bmid, bbright,(max(bloom,0.1)-.1)/.9)*sqrt(bloom),0.6) + sd*sd*.02;
	fragCol *= (1.0 - dot(uv,uv)*0.30); //vingetting lol
	fragCol = (smoothstep(vec4(-.34),vec4(1.), log(fragCol+1.0))-.2)/.8; //colour grading
}
