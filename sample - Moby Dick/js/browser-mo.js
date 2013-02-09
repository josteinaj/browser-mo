var MediaOverlay = {
  contentUrl: null,
  moUrl: null,
  audioMap: {},
  spine: [],
  current: null,
  onclipend: function() {
      var nextClip = null;
      for (var i = 0; i < MediaOverlay.spine.length-1; i++) {
          if (MediaOverlay.spine[i] === MediaOverlay.current) {
              nextClip = MediaOverlay.spine[i+1];
              break;
          }
      }
      MediaOverlay.current = null;
      if (nextClip !== null)
        MediaOverlay.oncontentclick.call($("#"+nextClip));
  },
  oncontentclick: function() {
    $("."+MediaOverlay.cssPrefix+"Highlight").removeClass(MediaOverlay.cssPrefix+"Highlight");
    for (var href in MediaOverlay.audioMap) {
        MediaOverlay.audioMap[href].stop();
    }
    if (MediaOverlay.current === null) {
        $(this).addClass(MediaOverlay.cssPrefix+"Highlight");
        MediaOverlay.audioMap[$(this).attr("data-mo-href")].play([$(this).attr("id")]);
        MediaOverlay.current = $(this).attr("id");
    } else {
        MediaOverlay.current = null;
    }
  }
};

$(function(){
    
    MediaOverlay.contentUrl = new URI(window.location.href);
    MediaOverlay.moUrl = new URI($("link[rel=mediaoverlay]").attr("href")).resolve(MediaOverlay.contentUrl);
    MediaOverlay.cssPrefix = $("meta[name='mediaoverlay.css-prefix']").attr("content");
    MediaOverlay.autoplay = $("meta[name='mediaoverlay.autoplay']").attr("content") === "true";
    
    $.ajax({
      url: MediaOverlay.moUrl.toString(),
      success: function(smil, textStatus, jqXHR){
                    clips = smil.getElementsByTagName("par");
                    var urlMap = {};
                    MediaOverlay.audioMap = {};
                    for (var c = 0; c < clips.length; c++) {
                        var clip = clips[c];
                        
                        var textref = clip.getElementsByTagName("text")[0].getAttribute("src").split("#");
                        if (typeof urlMap[textref[0]] === "undefined") {
                            urlMap[textref[0]] = new URI(textref[0]).resolve(MediaOverlay.contentUrl).toString();
                        }
                        if (urlMap[textref[0]] !== MediaOverlay.contentUrl.toString())
                            continue;
                        
                        var audioref = clip.getElementsByTagName("audio")[0].getAttribute("src").split("#");
                        if (typeof urlMap[audioref[0]] === "undefined") {
                            urlMap[audioref[0]] = new URI(audioref[0]).resolve(MediaOverlay.contentUrl).toString();
                            MediaOverlay.audioMap[urlMap[audioref[0]]] = {
                                urls: [urlMap[audioref[0]]],
                                autoplay: false,
                                onend: MediaOverlay.onclipend,
                                sprite: {}
                            };
                        }
                        
                        var clipBegin = clip.getElementsByTagName("audio")[0].getAttribute("clipBegin").split(":");
                        if (clipBegin.length === 3) clipBegin = Number(clipBegin[0])*3600 + Number(clipBegin[1])*60 + Number(clipBegin[2]);
                        else if (clipBegin.length === 2) clipBegin = Number(clipBegin[0])*60 + Number(clipBegin[1]);
                        else clipBegin = Number(clipBegin[0]);
                        clipBegin *= 1000;
                        
                        var clipEnd = clip.getElementsByTagName("audio")[0].getAttribute("clipEnd").split(":");
                        if (clipEnd.length === 3) clipEnd = Number(clipEnd[0])*3600 + Number(clipEnd[1])*60 + Number(clipEnd[2]);
                        else if (clipEnd.length === 2) clipEnd = Number(clipEnd[0])*60 + Number(clipEnd[1]);
                        else clipEnd = Number(clipEnd[0]);
                        clipEnd *= 1000;
                        
                        MediaOverlay.audioMap[urlMap[audioref[0]]].sprite[textref[1]] = [clipBegin, clipEnd-clipBegin];
                        
                        MediaOverlay.spine.push(textref[1]);
                        
                        var content = $("#"+textref[1]);
                        content.attr("data-mo-href", urlMap[audioref[0]]);
                        content.attr("data-mo-clipBegin", clipBegin);
                        content.attr("data-mo-clipBegin", clipEnd);
                        
                        var parents = $(content).parents();
                        for (var p = 0; p < parents.length; p++) {
                            // TODO: check if the element or any of its parents has any click listeners; and if so, don't add a click listener for these
                        }
                        
                        $("#"+textref[1]).click(MediaOverlay.oncontentclick);
                    }
                    for (var href in MediaOverlay.audioMap) {
                        MediaOverlay.audioMap[href] = new Howl(MediaOverlay.audioMap[href]);
                    }
                    
                    if (MediaOverlay.autoplay)
                        MediaOverlay.oncontentclick.call($("#"+MediaOverlay.spine[0]));
               },
      dataType: "xml"
    });
});