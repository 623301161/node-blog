/**
 * Created by hama on 2016/11/18.
 */
var mongo = require('./db');
//引入markdown插件
var markdown = require('markdown').markdown;
function Post(name,title,post){
    //发布人
    this.name = name;
    //标题
    this.title = title;
    //内容
    //XSS跨站脚本攻击的预防.
    //this.post = post.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    this.post = post;
}
module.exports = Post;
//保存文章
Post.prototype.save  = function(callback){
    var date = new Date();
    //保存当前时间的各种格式
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + '-' + (date.getMonth() + 1),
        day:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate(),
        minute:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
            date.getHours() + ':' +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    //我们要保存的数据
    var post = {
        name:this.name,
        time:time,
        title:this.title,
        post:this.post
    }
    //接下来就是常规的打开数据库->读取posts集合->内容插入->关闭数据库
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                //如果没有错的情况下,保存文章，不需要返回数据.
                callback(null);
            })
        })
    })
}
//获取文章
Post.get = function(name,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //查询
            collection.find(query).sort({
                time:-1
            }).toArray(function(err,docs){
                mongo.close();
                if(err){
                    return callback(err);
                }
                //在返回结果的时候，让markdown格式化一下
                //就可以直接使用markdown的语法规则来解析HTML标签了。
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                })
                callback(null,docs);//返回查询的文档数据.(数组形式)
            })
        })
    })
}