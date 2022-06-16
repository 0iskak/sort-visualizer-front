const wsHost = `wss://${location.host}/ws`;

const arraySizeElement: HTMLInputElement =
    document.body.querySelector('#size');
const arrayMinElement: HTMLInputElement =
    document.body.querySelector('#min');
const arrayMaxElement: HTMLInputElement =
    document.body.querySelector('#max');
const initialArrayElement: HTMLInputElement =
    document.body.querySelector('#initial-array');
const barsElement: HTMLDivElement =
    document.body.querySelector('#bars');
const algorithmsElement: HTMLSelectElement =
    document.body.querySelector('#algorithms');
const delayElement: HTMLSelectElement =
    document.body.querySelector('#delay');
const randomButtonElement: HTMLButtonElement =
    document.body.querySelector('#randomButton');
const sortButtonElement: HTMLButtonElement =
    document.body.querySelector('#sortButton');

let arrayObjs: ArrayObj[];

function setArray(array: number[]) {
    barsElement.replaceChildren();
    document.body.style.setProperty("--gap", `${100 / array.length / 10}em`);
    arrayObjs = array.map(i => {
        const obj = new ArrayObj(i);
        barsElement.append(obj.element);
        return obj;
    });
    initialArrayElement.innerText = `[${array.join(', ')}]`;
}

function setAlgorithms(array: string[]) {
    algorithmsElement.replaceChildren();
    array.forEach(s => {
        const option: HTMLOptionElement = document.createElement('option');
        option.value = s;
        option.innerText = s;

        algorithmsElement.append(option);
    })
}

function setSort(data: object) {
    if (!data) {
        arrayObjs.forEach((obj: ArrayObj) => {
            obj.state = State.INACTIVE
        });

        buttonsState(false);
        return;
    }

    const indexes: number[] = data['indexes'];
    const array: number[] = data['array'];


    for (let i = 0; i < array.length; i++) {
        const obj = arrayObjs[i];
        obj.state = indexes.includes(i) ? State.ACTIVE : State.NORMAL;
        obj.value = array[i];
    }

    indexes.map(i => arrayObjs[i])
        .forEach((obj: ArrayObj) => {
            obj.state = State.ACTIVE
        })
}

const random = "random";
const algorithms = "algorithms";
const sort = "sort";

const socket = new WebSocket(wsHost);

socket.onopen = () => {
    const message = new Message(algorithms);
    socket.send(message.toString());

    randomArray();
}

socket.onmessage = ev => {
    const message = Message.parse(ev.data);
    switch (message.action) {
        case random:
            setArray(message.data);
            break;
        case algorithms:
            setAlgorithms(message.data);
            break;
        case sort:
            setSort(message.data)
            break;
    }
}

function randomArray(): void {
    const message = new Message(random, {
        "size": Number(arraySizeElement.value),
        "min": Number(arrayMinElement.value),
        "max": Number(arrayMaxElement.value)
    });

    socket.send(message.toString());
}

function sortArray() {
    buttonsState(true)

    const message = new Message(sort, {
        "algorithm": algorithmsElement.value,
        "delay": delayElement.value,
        "array": arrayObjs.map(obj => obj.value)
    });

    socket.send(message.toString());
}

function buttonsState(disable: boolean) {
    randomButtonElement.disabled = disable
    sortButtonElement.disabled = disable
}

class Message {
    readonly action: string
    readonly data: any

    constructor(action: string, data: any = "") {
        this.action = action;
        this.data = data;
    }

    toString(): string {
        return JSON.stringify(this);
    }

    static parse(data: string): Message {
        return JSON.parse(data);
    }
}

enum State {
    NORMAL = "has-background-primary",
    ACTIVE = "has-background-danger",
    INACTIVE = "has-background-success"
}

class ArrayObj {
    private _value: number;
    private _state: State;
    readonly element: HTMLDivElement;

    constructor(value: number) {
        this.element = document.createElement('div');
        this.value = value;
        this.state = State.NORMAL;
    }

    set state(state: State) {
        this.element.classList.remove(this._state);
        this.element.classList.add(
            this._state = state
        );
    }

    set value(value: number) {
        this._value = value;
        this.element.style.height = `${this._value}%`;
    }

    get value(): number {
        return this._value;
    }
}

randomButtonElement.addEventListener('click', randomArray);
sortButtonElement.addEventListener('click', sortArray);
