const systemMap = {};
const relations = [];

$(document).ready(function() {
  const canvas = new fabric.Canvas('graphArea', {selection: false});

  const layoutGraph = () => {
    function posDif(systemCenter, aPos, rest) {
      let dx2 = (systemCenter.x - aPos.x) ** 2;
      let dy2 = (systemCenter.y - aPos.y) ** 2;
      const distance2 = dx2 + dy2;
      rest.dx += systemCenter.x > aPos.x ? distance2 - dx2 : dx2 - distance2;
      rest.dy += systemCenter.y > aPos.y ? distance2 - dy2 : dy2 - distance2;
      return rest;
    }

    Object.values(systemMap).forEach(currentSystem => {
      function calculateXYDiff(systemCenter) {
        return (rest, aPos) => {
          return posDif(systemCenter, aPos, rest);
        };
      }

      const push = Object.values(systemMap)
        .filter(sys => sys !== currentSystem)
        .map(sys => sys.getCenterPoint())
        .reduce(calculateXYDiff(currentSystem.getCenterPoint()), {dx:0, dy:0});

      const pull = findAffectedRelations(currentSystem)
        .reduce((rest, rel) => {
          return posDif(rel.source.getCenterPoint(), rel.destination.getCenterPoint(), rest);
        }, {dx:0, dy:0});

      console.log({system: currentSystem, push, pull});
    })
    // För varje system:
    // 1. räkna ut avståndet => omvänd kraft 1/d^2
    // 2. dela upp i x, resp y komponent

    // För varje kopplad relation:
    // 1. räkna ut avståndet => kraft d^2
    // 2. dela upp i x, resp y komponent
  }

  const $button = $('<button>Layout</button>').click(layoutGraph);
  $('body').append($button);

  const Edge = fabric.util.createClass(fabric.Line, {
    type: 'edge',
    // initialize can be of type function(options) or function(property, options), like for text.
    // no other signatures allowed.
    initialize: function(p1, p2, options) {
      this.source = p1;
      this.destination = p2;
      this.points = this.updatePosition();
      options = {...{fill: 'black', stroke: 'black', strokeWidth: 1, selectable: false,
        evented: true, hasBorders:false, lockScalingX: true, lockScalingY:true},...options};

      this.callSuper('initialize', this.points, options);
      this.set('label', options.label || '');
    },

    updatePosition: function() {
      let newPos = {x1: this.source.left + this.source.width / 2, y1: this.source.top + this.source.height / 2,
        x2: this.destination.left + this.destination.width / 2, y2: this.destination.top + this.destination.height / 2};
      //console.log('Moving', this, 'to', newPos);
      this.set(newPos);
      return [newPos.x1, newPos.y1, newPos.x2, newPos.y2];
    },

    toObject: function() {
      return fabric.util.object.extend(this.callSuper('toObject'), {
        label: this.get('label')
      });
    },

    _render: function(ctx) {
      this.callSuper('_render', ctx);

      ctx.font = '9px Helvetica';
      ctx.fillStyle = '#333';
      const size = ctx.measureText(this.label);
      ctx.fillText(this.label,-size.width / 2, -10/2);
    }
  });


  function createRelation(rel) {
    const sys1 = createSystem(rel.fromSystem);
    const sys2 = createSystem(rel.toSystem);
    let edge = new Edge(sys1, sys2, {label: rel.dataType});
    relations.push(edge);
    canvas.add(edge);
    edge.sendToBack();
  }

  function createSystem(systemName) {
    let result = systemMap[systemName];
    if (!result) {
      const text = new fabric.Text(systemName, { fontFamily: 'Courier New', left: 2, top: 0, fontSize: 16,fill: '#000000'});
      const rect = new fabric.Rect({
        stroke: 'black', strokeLineJoin: 'round', strokeWidth: 2,
        rx: 5, ry: 5, width: Math.max(60, text.width + 4), height: 20,
        fill: 'lightgray',
        lockScalingX: true, lockScalingY:true
      });
      result = new fabric.Group([rect, text], { left: Math.random() * 300, top: Math.random() * 300});
      systemMap[systemName] = result;
      canvas.add(result);
    }
    return result;
  }


  $.getJSON('systems/org')
    .done(function(data) {
      data.forEach(node => {
        createRelation(node);
      });
      canvas.renderAll();
    })
    .fail(function() {
      console.log( "error" );
    })
    .always(function() {
      console.log( "complete" );
    });

  function findAffectedRelations(target) {
    return relations.filter(rel => {
      return target === rel.source || target === rel.destination;
    });
  }

  let updateTimer;

  canvas.on('object:moving', function (event) {
    const relations = findAffectedRelations(event.target);
    relations.forEach(rel => rel.updatePosition());
    updateTimer = updateTimer || setTimeout(() => {
      updateTimer = null;
      //canvas.renderAll();
    }, 500);
  });
  // canvas.on({
  //   'object:scaling': (obj) => {
  //     if (obj.target.get('type') === 'group') {
  //       const group = obj.target;
  //       let orgList = obj.target.getObjects();
  //       let texts = orgList.filter(obj => obj.get('type') === 'text');
  //       //console.log({orgList, texts});
  //       texts.forEach(text => {
  //         const scaleX = text.width / group.width
  //         const scaleY = text.height / group.height;
  //         text.scaleX = scaleX;
  //         text.scaleY = scaleY;
  //         //console.log({scaleX, scaleY, text:text.toJSON()});
  //       });
  //     }
  //   }
  // })

});
