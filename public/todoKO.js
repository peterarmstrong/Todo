// Generated by CoffeeScript 1.6.2
/*
The way I have chosen to structure this file is as follows:

  o Whenever an action happens, send a message over the socket to the server
  o The server will broadcast the message to all sockets (including the sender)
  o Then all the sockets will update themselves

  o The methods with "Private" in their names are the ones that actually do the updating on the client side
  o The other ones are the methods who send the message to the server
*/


(function() {
  var Task, socket, tasks, url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  url = "ws://" + window.location.host;

  socket = window['MozWebSocket'] ? new MozWebSocket(url) : new WebSocket(url);

  tasks = null;

  socket.onmessage = function(message) {
    var data, entry, id, t, task, _i, _len;

    message = JSON.parse(message.data);
    if (message.type === 'init') {
      data = message.todos;
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        entry = data[_i];
        t = new Task(entry[1], entry[0], entry[2]);
        tasks.addInitialTasks(t);
      }
    }
    if (message.type === 'new') {
      data = message.text;
      tasks.addTaskPrivate(new Task(data[1], data[0], data[2]));
    }
    if (message.type === 'delete') {
      id = message.id;
      task = tasks.getTaskByID(parseInt(id));
      if (task != null) {
        tasks.deletePrivate(task);
      }
    }
    if (message.type === 'complete') {
      tasks.completePrivate(tasks.getTaskByID(parseInt(message.id)));
    }
    if (message.type === 'uncomplete') {
      return tasks.uncompletePrivate(tasks.getTaskByID(parseInt(message.id)));
    }
  };

  Task = (function() {
    function Task(descr, id, finished) {
      this.description = ko.observable(descr);
      this.ID = ko.observable(id);
      this.isFinished = ko.observable(finished);
    }

    Task.prototype.print = function() {
      return console.log(this.description() + "..." + (parseInt(this.ID())) + "..." + this.isFinished());
    };

    return Task;

  })();

  $(function() {
    var TaskViewModel;

    TaskViewModel = (function() {
      function TaskViewModel() {
        this.getTaskByID = __bind(this.getTaskByID, this);
        this.deletePrivate = __bind(this.deletePrivate, this);
        this["delete"] = __bind(this["delete"], this);
        this.uncompletePrivate = __bind(this.uncompletePrivate, this);
        this.completePrivate = __bind(this.completePrivate, this);
        this.uncompleteTask = __bind(this.uncompleteTask, this);
        this.completeTask = __bind(this.completeTask, this);
        this.addTaskPrivate = __bind(this.addTaskPrivate, this);
        this.addInitialTasks = __bind(this.addInitialTasks, this);
        this.addTask = __bind(this.addTask, this);        this.complete = ko.observableArray([]);
        this.incomplete = ko.observableArray([]);
      }

      TaskViewModel.prototype.addTask = function(str) {
        return socket.send(JSON.stringify({
          type: "new",
          text: str
        }));
      };

      TaskViewModel.prototype.addInitialTasks = function(task) {
        if (task.isFinished()) {
          return this.complete.push(task);
        } else {
          return this.incomplete.push(task);
        }
      };

      TaskViewModel.prototype.addTaskPrivate = function(task) {
        if (task.isFinished()) {
          return this.complete.splice(0, 0, task);
        } else {
          return this.incomplete.splice(0, 0, task);
        }
      };

      TaskViewModel.prototype.completeTask = function(task) {
        return socket.send(JSON.stringify({
          type: "complete",
          id: task.ID()
        }));
      };

      TaskViewModel.prototype.uncompleteTask = function(task) {
        return socket.send(JSON.stringify({
          type: "uncomplete",
          id: task.ID()
        }));
      };

      TaskViewModel.prototype.completePrivate = function(task) {
        this.incomplete.remove(task);
        return this.complete.splice(0, 0, task);
      };

      TaskViewModel.prototype.uncompletePrivate = function(task) {
        this.complete.remove(task);
        return this.incomplete.splice(0, 0, task);
      };

      TaskViewModel.prototype["delete"] = function(task) {
        return socket.send(JSON.stringify({
          type: "delete",
          id: parseInt(task.ID())
        }));
      };

      TaskViewModel.prototype.deletePrivate = function(task) {
        this.complete.remove(task);
        return this.incomplete.remove(task);
      };

      TaskViewModel.prototype.getTaskByID = function(id) {
        var retVal,
          _this = this;

        retVal = null;
        ko.utils.arrayForEach(this.incomplete(), function(task) {
          if (task != null) {
            if (task.ID() === id) {
              return retVal = task;
            }
          }
        });
        ko.utils.arrayForEach(this.complete(), function(task) {
          if (task != null) {
            if (task.ID() === id) {
              return retVal = task;
            }
          }
        });
        return retVal;
      };

      return TaskViewModel;

    })();
    tasks = new TaskViewModel();
    ko.applyBindings(tasks);
    $("#addNewBtn").click(function() {
      socket.send(JSON.stringify({
        type: "new",
        text: $('#newTask').val()
      }));
      return $("#newTask").val('');
    });
    return $("#newTask").bind('enterKey', function() {
      return $('#addNewBtn').trigger('click');
    }).keyup(function(e) {
      if (e.keyCode === 13) {
        return $(this).trigger('enterKey');
      }
    });
  });

}).call(this);
