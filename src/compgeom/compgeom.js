export const IntersectionType = {
    DO_NOT_INTERSECT: 0,
    DO_INTERSECT: 1,
    TOUCH: 2,
    COLLINEAR: 3
}

export const SIGN = {
    NEGATIVE: -1,
    ZERO: 0,
    POSITIVE: 1
}

const ABSTOL = 1e-7;

function area2d(p1,p2,p3){
    var A = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
    },
    B = {
        x: p3.x - p1.x,
        y: p3.y - p1.y
    }

    //crossproduct

    return (A.x*B.y - B.x*A.y);
}

function orientation(p1, p2, p3){
    var val = (p2.y - p1.y)*(p3.x - p2.x) - 
                (p2.x - p1.x)*(p3.y - p2.y);

    if (val === 0) {
        return SIGN.ZERO //colinear
    }

    return (val > 0) ? SIGN.POSITIVE : SIGN.NEGATIVE //clock or counterclock wise
}

export function computeSegmentSegmentIntersection(params) {
    var area123 = 0.0; // twice the area of triangle 123
    var area124 = 0.0; // twice the area of triangle 124
    var area341 = 0.0; // twice the area of triangle 341
    var area342 = 0.0; // twice the area of triangle 342

    var x12_l, x12_r;
    var x34_l, x34_r;

    x12_l = (params.p1.x < params.p2.x) ? params.p1.x : params.p2.x;
    x12_r = (params.p1.x > params.p2.x) ? params.p1.x : params.p2.x;
    x34_l = (params.p3.x < params.p4.x) ? params.p3.x : params.p4.x;
    x34_r = (params.p3.x > params.p4.x) ? params.p3.x : params.p4.x;

    if ((x12_r + ABSTOL) < x34_l || x34_r < (x12_l-ABSTOL)) {
        return IntersectionType.DO_NOT_INTERSECT;
    }

    var y12_b, y12_t;
    var y34_b, y34_t;

    y12_b = (params.p1.y < params.p2.y) ? params.p1.y : params.p2.y;
    y12_t = (params.p1.y > params.p2.y) ? params.p1.y : params.p2.y;
    y34_b = (params.p3.y < params.p4.y) ? params.p3.y : params.p4.y;
    y12_b = (params.p3.y > params.p4.y) ? params.p3.y : params.p4.y;

    if ((y12_t + ABSTOL) < y34_b || y34_t < (y12_b-ABSTOL)) {
        return IntersectionType.DO_NOT_INTERSECT;
    }

    var sign123 = orientation(params.p1, params.p2, params.p3);
    var sign124 = orientation(params.p1, params.p2, params.p4);

    if (sign123 === SIGN.ZERO && sign124 === SIGN.ZERO) {
        return IntersectionType.COLLINEAR;
    }

    //check if second segment is on the same side of first segment

    if (orientation(params.p1, params.p2, params.p3) === SIGN.POSITIVE && 
        orientation(params.p1, params.p2, params.p4) === SIGN.POSITIVE) 
    {
        console.log('a')
        return IntersectionType.DO_NOT_INTERSECT;
    }
    else if (orientation(params.p1, params.p2, params.p3) === SIGN.NEGATIVE && 
        orientation(params.p1, params.p2, params.p4) === SIGN.NEGATIVE) 
    {
        console.log('b')
        return IntersectionType.DO_NOT_INTERSECT;
    }

    //checks for first segment on the same side of second segment

    if (orientation(params.p3, params.p4, params.p1) === SIGN.POSITIVE && 
        orientation(params.p3, params.p4, params.p2) === SIGN.POSITIVE) 
    {
        console.log('c')
        return IntersectionType.DO_NOT_INTERSECT;
    }
    else if (orientation(params.p3, params.p4, params.p1) === SIGN.NEGATIVE && 
        orientation(params.p3, params.p4, params.p2) === SIGN.NEGATIVE) 
    {
        console.log('d')
        return IntersectionType.DO_NOT_INTERSECT;
    }

    //treat the touch cases

    params.t34 = area2d(params.p1,params.p2,params.p3)/(area2d(params.p1,params.p2,params.p3) - area2d(params.p1,params.p2,params.p4));

    var v34 = {
        x: params.p4.x - params.p3.x,
        y: params.p4.y - params.p3.y
    }

    params.pi = {
        x: params.p3.x + params.t34*v34.x,
        y: params.p3.y + params.t34*v34.y
    }

    return IntersectionType.DO_INTERSECT;
}