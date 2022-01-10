//---- jQ VERSION ----

$(document).ready(function () {
    //global
    const addBtn = $('#add-btn');
    const activeBtn = $('#active');
    const archBtn = $('#arch');
    const textInput = $('#input');
    const allBtn = $('#allBtn');

    let allObjectArr = [];
    let isNeedFilteredList = false;
    let isNeedFilteredCheckedList = false;

    const mainUrl = 'http://82.202.204.90:8080/api/todo/?format=json';

    const deleteUrl = (data) => {
        return url = `http://82.202.204.90:8080/api/todo/${data}/?format=json`
    }

    //ajax req
    const makeRequest = (method, url, data, handler = function () {
    }) => {
        $.ajax({
            url: url,
            method: method,
            data: data,
            success: function (response) {
                handler(response);
            }
        })
    }

    //display tasks
    const displayTasks = (dataFromServer) => {
        $(dataFromServer).each(function (i) {
            let item = dataFromServer[i];
            let card = $('<div></div>').addClass('card-body');
            card.attr('currentId', `${item.id}`);
            card.html(
                `<div class="text" id="text">${item.title}</div>
                 <input type='checkbox' class="checkbox withOutTimer" id="checkbox" ${(item.done) ? 'checked' : ''}>
                 <button class="editBtn" id="editBtn"></button>
                 <button class="deleteBtn" id="deleteBtn"></button>
                 <button class="confirm" id="confirm"></button>`);
            $('#todo').prepend(card);
            if ($('#checkbox').prop('checked')) {
                $('#text').css({'color': 'red', 'textDecoration': 'line-through'})
            }
        })
    }

    //delete task
    $(document).on('click', '.deleteBtn', function () {
        let data = {};
        data.id = $(this).parent().attr('currentId');
        data.title = $(this).parent().children('.text').text();
        data.done = $(this).is(':checked') ? true : false;
        $("#todo").empty();
        makeRequest('DELETE', deleteUrl(data.id), data, getList);
    })

    //edit task
    $(document).on('click', '.editBtn', function () {
        let data = {};
        const lastText = $(this).parent().children('.text');
        data.id = $(this).parent().attr('currentId');
        $('.text').attr('contentEditable', 'true');
        $(this).parent().children('.text').focus();
        $(this).parent().children('.confirm').css('display', 'block');

        //confirm on enter
        $('.text').keydown(function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                if ($(this).parent().children('.text').text().length >= 1) {
                    data.title = $(this).parent().children('.text').text();
                    $('#text').attr('contentEditable', 'false');
                    $("#todo").empty();
                    $('.confirm').css('display', 'none');
                    makeRequest('PUT', deleteUrl(data.id), data, getList);
                } else {
                    alert('Field cant be empty!');
                }
            }
        })
        //confirm on click btn
        $('.confirm').click(function () {
            if ($(this).parent().children('.text').text().length >= 1) {
                data.title = $(this).parent().children('.text').text();
                $('#text').attr('contentEditable', 'false');
                $("#todo").empty();
                $(this).css('display', 'none');
                makeRequest('PUT', deleteUrl(data.id), data, getList);
            } else {
                alert('Field cant be empty!');
            }
        })

        $(this).replaceWith('<button class="closeEdit"></button>')

        function closeWithSaveText(idx) {
            if (idx.length >= 1) {
                $('.closeEdit').replaceWith('<button class="editBtn" id="editBtn"></button>');
                $('.confirm').css('display', 'none');
                $(idx).attr('contentEditable', 'false');
            } else {
                alert('Field cant be empty!');
            }
            const currentText = allObjectArr.results.filter(arr => arr.id == data.id);
            idx.text(currentText[0].title)
        }

        $('.closeEdit').click(function () {
            closeWithSaveText(lastText)
        })
    })

    //checkboxes change
    $(document).on('change', '.checkbox', function () {
        let data = {};
        let timerTime = 5;
        let timer;
        let againCount;
        data.id = $(this).parent().attr('currentId');
        data.title = $(this).parent().children('.text').text();
        data.done = $(this).is(':checked') ? true : false;
        $(this).removeClass('withOutTimer').addClass('withTimer')
        $('.withOutTimer').attr('disabled', 'true');
        $('.navBtn').attr('disabled', 'true');
        $('.navBtn').css('background-color', 'grey');

        if (data.done == true) {
            $(this).parent().children('.text').css({'color': 'red', 'textDecoration': 'line-through'});
            $(this).parent().append('<p class="timerCount"></p>');
            $('.timerCount').text(timerTime);
            function againCounter() {
                $('.timerCount').text(--timerTime);
            }
            againCount = setInterval(againCounter, 1000);
            timer = setTimeout(refreshCheck, 5500);

        } else {
            clearTimeout(timer);
            clearInterval(againCount);
            $('.timerCount').text('');
            $(this).parent().children('.text').css({'color': 'black', 'textDecoration': 'none'});
            refreshCheck();
        }

        function refreshCheck() {
            clearTimeout(timer);
            clearInterval(againCount);
            $("#todo").empty();
            makeRequest('PUT', deleteUrl(data.id), data, getList);
        }

        //clear timer
        $(this).on('change', function () {
            $('.timerCount').text('');
            clearTimeout(timer);
            clearInterval(againCount);
            $(this).parent().children('.text').css({'color': 'black', 'textDecoration': 'none'});
        })
    })

    //next page list
    function checkNext() {
        if (allObjectArr.count >= 10 && allObjectArr.next != null) {
            $('#todo').append('<button class="next navBtn btn">Next</button>');
            $('.next').click(function () {
                $("#todo").empty();
                makeRequest('GET', allObjectArr.next, null, getListHandler);
            })
        }
    }

    //prev page list
    function checkPrev() {
        if (allObjectArr.count >= 10 && allObjectArr.previous != null) {
            $('#todo').append('<button class="prev navBtn btn">Previous</button>');
            $('.prev').click(function () {
                $("#todo").empty();
                makeRequest('GET', allObjectArr.previous, null, getListHandler);
            })
        }
    }

    //unchecked
    const filterListHandler = () => {
        $("#todo").empty();
        const newArik = allObjectArr.results.filter(arr => arr.done == false);
        displayTasks(newArik);
    }

    //checked
    const filterCheckListHandler = () => {
        $("#todo").empty();
        const newArik = allObjectArr.results.filter(arr => arr.done == true);
        displayTasks(newArik);
    }

    //show all tasks
    allBtn.click(function () {
        isNeedFilteredList = false;
        isNeedFilteredCheckedList = false;
        $("#todo").empty();
        getList();
    })

    //show active tasks
    activeBtn.click(function () {
        isNeedFilteredList = true;
        isNeedFilteredCheckedList = false;
        getList();
    })

    //show done tasks
    archBtn.click(function () {
        isNeedFilteredList = false;
        isNeedFilteredCheckedList = true;
        getList();
    })

    //add new task
    addBtn.click(() => {
        let thisTitle = $(textInput).val();
        let aNewTask = {
            title: thisTitle,
            done: false,
        }
        if (aNewTask.title !== '') {
            makeRequest('POST', mainUrl, aNewTask);
            document.getElementById("input").value = "";
            document.getElementById("todo").innerHTML = "";
            getList();
        } else {
            alert('ERROR')
        }
    })

    $(textInput).keydown(function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(textInput).blur();
            let thisTitle = $(textInput).val();
            let aNewTask = {
                title: thisTitle,
                done: false,
            }
            if (aNewTask.title !== '') {
                makeRequest('POST', mainUrl, aNewTask);
                document.getElementById("input").value = "";
                document.getElementById("todo").innerHTML = "";
                getList();
            } else {
                alert('ERROR');
            }
        }
    })

    //
    function getListHandler(response) {
        allObjectArr = response;
        if (isNeedFilteredList) {
            filterListHandler();
        } else if (isNeedFilteredCheckedList) {
            filterCheckListHandler();
        } else {
            displayTasks(allObjectArr.results);
        }
        checkNext();
        checkPrev();
    }

    function getList() {
        makeRequest('GET', mainUrl, null, getListHandler);
    }

    getList();
});

// ---- JS VERSION ----
// const addBtn = document.querySelector('#add-btn');
// const activeBtn = document.querySelector('#active');
// const archBtn = document.querySelector('#arch');
// const textInput = document.querySelector('#input');
// let allObjectArr = [];
//
// const requestUrl = 'http://82.202.204.90:8080/api/todo/?format=json';
// const deleteUrl = (data) => {
//     url = `http://82.202.204.90:8080/api/todo/${data}/?format=json`
//     return url
// }
//
// const makeRequest = (method, url, body, handler = function () {
// }) => {
//     const request = new XMLHttpRequest();
//     request.open(method, url, true);
//     request.setRequestHeader('Content-type', 'application/json; charset=utf-8');
//     request.addEventListener('load', () => {
//         handler(request.response);
//         // allObjectArr = JSON.parse(request.response).results;
//     })
//     if (body !== null) {
//         request.send(JSON.stringify(body));
//     } else {
//         request.send();
//     }
// }
//
//
// const displayTasks = (dataFromServer) => {
//     dataFromServer.forEach(item => {
//         let card = document.createElement('div');
//         card.classList.add('card-body');
//         card.innerHTML = `
//             <input type='checkbox' class="checkbox" id="checkbox" ${(item.done) ? 'checked' : ''}>
//             <div class="text" id="text">${item.title}</div>
//             <button class="editBtn" id="editBtn"></button>
//             <button class="deleteBtn" id="deleteBtn" onclick="makeRequest('DELETE', deleteUrl(${item.id}), ${item.id}, deleteDataHandler)"></button>`;
//         document.querySelector('#todo').prepend(card);
//     })
// }
//
// const getListHandler = (response) => {
//     const tasksArray = JSON.parse(response).results;
//     displayTasks(tasksArray);
// }
//
// const isChecked = () => {
//     var checkboxes = document.getElementsByClassName('checkbox');
//     var checkboxesChecked = [];
//     for (var i = 0; i < checkboxes.length; i++) {
//         if (checkboxes[i].checked) {
//             checkboxesChecked.push(checkboxes[i]);
//         }
//     }
//     return checkboxesChecked
// }
//
// const filterListHandler = (response) => {
//     const tasksArray = JSON.parse(response).results;
//     const filteredArr = tasksArray.filter(arr => arr.done !== true)
//     document.getElementById("todo").innerHTML = "";
//     displayTasks(filteredArr);
//
// }
//
// const filterCheckListHandler = (response) => {
//     const tasksArray = JSON.parse(response).results;
//     const filteredArr = tasksArray.filter(arr => arr.done == true)
//     document.getElementById("todo").innerHTML = "";
//     displayTasks(filteredArr);
// }
//
//
// archBtn.addEventListener('click', function () {
//     makeRequest('GET', requestUrl, null, filterCheckListHandler);
// })
//
// activeBtn.addEventListener('click', function () {
//     makeRequest('GET', requestUrl, null, filterListHandler);
// })
//
// const deleteDataHandler = () => {
//     document.getElementById("todo").innerHTML = "";
//     makeRequest('GET', requestUrl, null, getListHandler);
// }
//
// addBtn.addEventListener('click', () => {
//     let thisTitle = `${textInput.value}`;
//     let aNewTask = {
//         title: thisTitle,
//         done: false,
//     }
//     if (aNewTask.title !== '') {
//         makeRequest('POST', requestUrl, aNewTask);
//         document.getElementById("input").value = "";
//         document.getElementById("todo").innerHTML = "";
//         makeRequest('GET', requestUrl, null, getListHandler);
//     } else {
//         alert('ERROR')
//     }
// })
//
// makeRequest('GET', requestUrl, null, getListHandler);