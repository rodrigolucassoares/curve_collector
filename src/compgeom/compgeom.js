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
}