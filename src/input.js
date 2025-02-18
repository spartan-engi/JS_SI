
// keystates, read this instead of directly listening to the events
let key_states = { 
	'd' : 0,
	'a' : 0,
	'e' : 0,
	'q' : 0,
	'w' : 0,
	's' : 0,
}

let movMouse = [0,0];
// key callback
function onKeyPress(event)
{
    switch(event.key)
    {
        case 'd':	key_states['d'] = 1;	break;
        case 'a':	key_states['a'] = 1;	break;
        case 'e':	key_states['e'] = 1;	break;
        case 'q':	key_states['q'] = 1;	break;
        case 'w':	key_states['w'] = 1;	break;
        case 's':	key_states['s'] = 1;	break;
    }
    // print(key_states);
}

function onKeyRelease(event)
{
    switch(event.key)
    {
        case 'd':	key_states['d'] = 0;	break;
        case 'a':	key_states['a'] = 0;	break;
        case 'e':	key_states['e'] = 0;	break;
        case 'q':	key_states['q'] = 0;	break;
        case 'w':	key_states['w'] = 0;	break;
        case 's':	key_states['s'] = 0;	break;
    }
    // print(key_states);
}


// click callback
let pointerLock = 0;
async function onMouseClick(event)
{
    // x = event.offsetX;
    // y = event.offsetY;
    // console.log(x,y);
    // pos[0] = initial_pos[0];
    // pos[1] = initial_pos[1];
    // pos[2] = initial_pos[2];
    if(pointerLock)
    {
        document.exitPointerLock();
        print("unlock");
        pointerLock = 0;
    }
    else
    {
        await canvas.requestPointerLock();
        print("lock!");
        pointerLock = 1;
    }
}


// mouse motion callback
function onMouseMove(event)
{
    if(!pointerLock) return;
    //print([event.movementX, event.movementY]);
    movMouse = [event.movementX, event.movementY];
}